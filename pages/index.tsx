import {
  Connector,
  useAccount,
  useConnectors,
  useNetwork,
  useSignTypedData,
} from "@starknet-react/core";
import axios, { AxiosError } from "axios";
import { NextPageContext } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../components/button";
import Window from "../components/Window";
import messageToSign from "../starknet/message";
import { prisma } from "../prisma/client";

const reveal = "January the 9th at 7pm UTC";

export default function Home({
  participantsCount,
}: {
  participantsCount: number;
}) {
  const { address, status } = useAccount();
  const { chain } = useNetwork();

  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    const queryParticipants = async () => {
      const { data } = await axios.get("/api/signatures");
      setParticipants(data.signatures);
    };
    queryParticipants();
  }, []);

  const isMainnet = chain && chain.id === "0x534e5f4d41494e";

  const {
    connect,
    disconnect,
    available,
    refresh: refreshConnectors,
  } = useConnectors();
  const { data: signature, signTypedData } = useSignTypedData(messageToSign);
  const [code, setCode] = useState("");

  const launchSign = useRef(false);
  useEffect(() => {
    if (address && launchSign.current && isMainnet) {
      launchSign.current = false;
      signTypedData();
    }
  }, [address, isMainnet, signTypedData]);

  const [verifyingSignature, setVerifyingSignature] = useState("notyet");
  const [verifyingTweet, setVerifyingTweet] = useState("notyet");

  useEffect(() => {
    if (address && signature) {
      setVerifyingSignature("verifyingSignature");
      axios
        .post("/api/sign", {
          account: address,
          signature,
        })
        .then((data) => {
          setCode(data.data?.code);
          setVerifyingSignature("done");
        })
        .catch((e: AxiosError) => {
          const error = (e.response?.data as any)?.error;
          setVerifyingSignature(error || "ERROR");
        });
    }
  }, [address, signature]);

  const [argentConnector, setArgentConnector] = useState<Connector | null>(
    null
  );

  const argentAvailableRef = useRef(false);
  const [argentAvailable, setArgentAvailable] = useState(false);

  useEffect(() => {
    const connector = available.find((c) => c.id() === "argentX");
    if (connector) {
      setArgentConnector(connector);
      argentAvailableRef.current = true;
      setArgentAvailable(connector.available());
    } else {
      argentAvailableRef.current = false;
      setArgentAvailable(false);
    }
  }, [available]);

  const [clickedTweet, setClickedTweet] = useState(false);

  const tweetInputRef = useRef<HTMLInputElement>(null);

  const validateTweet = useCallback(async () => {
    const tweetURL = tweetInputRef.current?.value?.trim();
    if (!tweetURL) return;
    setVerifyingTweet("verifying");
    try {
      await axios.post("/api/tweet", { tweetURL });
      setVerifyingTweet("done");
    } catch (e: any) {
      setVerifyingTweet(e.response?.data?.error);
    }
  }, []);

  const openTweet = useCallback(() => {
    setVerifyingTweet("notyet");
    const textToTweet = `I've just entered the first on-chain NFT giveaway hosted by @PxlsWtf and @argentHQ on StarkNet by signing a message with my Argent X wallet (it's free!)\n
proof:${code}\n
You can enter and find the rules here: https://argentx.pxls.wtf/`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToTweet)}`
    );
  }, [code]);

  let statusComponent = <div></div>;

  useEffect(() => {
    let interval: any = setInterval(() => {
      if (argentAvailableRef.current) {
        clearInterval(interval);
        interval = null;
      } else {
        refreshConnectors();
        console.log("refreshing connectors");
      }
    }, 1000);
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [refreshConnectors]);

  if (status === "disconnected" || verifyingSignature !== "done") {
    statusComponent = (
      <div>
        <div>
          <b>Step 1</b>
        </div>
        <div>
          Sign with your{" "}
          <a
            href="https://chrome.google.com/webstore/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb"
            target="_blank"
            rel="noreferrer"
          >
            Argent X wallet
          </a>
        </div>
        {verifyingSignature === "verifyingSignature" && (
          <div className="mt-6">
            <em>Verifying your signature...</em>
          </div>
        )}
        {verifyingSignature !== "verifyingSignature" && (
          <>
            <div className="max-w-[325px] mx-auto">
              <Button
                text={
                  argentAvailable
                    ? "Connect and sign"
                    : "Please install Argent X"
                }
                action={() => {
                  if (!argentAvailable || !argentConnector) return;
                  if (status !== "disconnected" && !isMainnet) {
                    try {
                      disconnect();
                    } catch (e) {
                      console.log(e);
                    }
                    launchSign.current = true;
                    connect(argentConnector);
                  } else if (status === "disconnected") {
                    launchSign.current = true;
                    connect(argentConnector);
                  } else if (isMainnet) {
                    signTypedData();
                  }
                }}
                disabled={!argentAvailable}
                rainbow
                block
              />
            </div>
            {status !== "disconnected" && !isMainnet && (
              <div className="text-[#FF4848] text-sm mt-2">
                Please connect to Starknet mainnet.
              </div>
            )}
            {verifyingSignature !== "notyet" && (
              <div className="text-[#FF4848] text-sm mt-2">
                There was a problem. If you just deployed your Argent wallet,
                please wait a moment and try again.
              </div>
            )}
          </>
        )}
      </div>
    );
  } else if (verifyingSignature === "done" && !clickedTweet) {
    statusComponent = (
      <div>
        <div>
          <b>Step 2</b>
        </div>
        <div>
          Tweet (you will be able to review the tweet before it’s sent). Do not
          remove the code from the tweet.
        </div>
        <div className="max-w-[325px] mx-auto">
          <Button
            text="Tweet"
            action={() => {
              openTweet();
              setClickedTweet(true);
            }}
            rainbow
            block
          />
        </div>
      </div>
    );
  } else if (
    verifyingSignature === "done" &&
    clickedTweet &&
    verifyingTweet !== "done"
  ) {
    statusComponent = (
      <div>
        <div>
          <b>Step 3</b>
        </div>
        {verifyingTweet !== "verifying" && (
          <>
            <div>Paste the URL of your tweet below</div>
            <div className="max-w-[325px] mx-auto">
              <input
                className="border-black border w-[325px] h-[42px] outline-none p-2 mt-3"
                ref={tweetInputRef}
                placeholder="Link to tweet"
              />
              <Button text="Validate" action={validateTweet} rainbow block />
            </div>
            {verifyingTweet === "WRONG_URL" && (
              <div className="text-[#FF4848] text-sm mt-2">
                We could not find your tweet. Please{" "}
                <span className="underline cursor-pointer" onClick={openTweet}>
                  try again
                </span>
                .
              </div>
            )}
            {verifyingTweet === "WRONG_TWEET" && (
              <div className="text-[#FF4848] text-sm mt-2">
                We could find your tweet but it does not contain the expected
                content (do not remove the code from the tweet). Please{" "}
                <span className="underline cursor-pointer" onClick={openTweet}>
                  tweet again
                </span>
                .
              </div>
            )}
          </>
        )}
        {verifyingTweet === "verifying" && (
          <div className="mt-6">
            <em>Verifying your tweet...</em>
          </div>
        )}
      </div>
    );
  } else if (
    verifyingSignature === "done" &&
    clickedTweet &&
    verifyingTweet === "done"
  ) {
    statusComponent = (
      <div>
        <div className="mb-2">
          <b>You&apos;re all set!</b>
        </div>
        <div>
          Your participation has been taken into account. On {reveal} we’ll
          randomly pick the winner amongst participants.
          <br />
          <br />
          The winner will be announced on{" "}
          <a
            href="https://twitter.com/argentHQ"
            target="_blank"
            rel="noreferrer"
          >
            @argentHQ
          </a>{" "}
          &{" "}
          <a
            href="https://twitter.com/PxlsWtf"
            target="_blank"
            rel="noreferrer"
          >
            @PxlsWtf
          </a>{" "}
          Twitter accounts.
        </div>
      </div>
    );
  }

  statusComponent = (
    <div>
      <div className="mb-2">
        <b>Making this tool opensource</b>
      </div>
      <div>
        This tool is now opensource. Any builder on Starknet can re-use it to
        engage their community. We believe this is the way to make it all
        together - have fun playing with it!
        <br />
        <Button
          text="Go to Github repo"
          action={() => {
            window.open("https://github.com/nmalzieu/pxls-argent-giveaway");
          }}
          rainbow
          block
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="background">
        <div className="container text-center mx-auto">
          <img src="/logo.svg" className="mx-auto py-8" />
          <img src="/giveaway.svg" className="mx-auto mt-12" />
          <div className="mt-[80px] mb-[60px] md:mt-[150px] md:mb-[150px] relative">
            <img
              src="/33.svg"
              className="w-[189px] h-[189px] md:w-[400px] md:h-[400px] border-2 border-black inline-block"
            />
            <img
              src="/pink_border.svg"
              className="absolute top-1/2 left-1/2 -translate-x-1/2	-translate-y-1/2 w-[254px] h-[252px] md:w-auto md:h-auto"
            />
          </div>
          <p className="text-white max-w-[407px] text-center mx-auto p-6 md:p-0 mb-12">
            Starknet people, thank you so much for making this giveaway a
            success! {participantsCount} wallets participated in the first ever
            on-chain giveaway on Starknet and we’ll pick the winner of the
            “Argent X PXLS” rtwrk NFT very soon.
            <br /> <br />
            <a
              href="https://aspect.co/asset/0x0044bac3f28118ea1946963a1bc1dc6e3752e2ed1b355c0113fd8087d2db6b66/33"
              target="_blank"
              rel="noreferrer"
            >
              See it on Aspect
            </a>{" "}
            -{" "}
            <a
              href="https://mintsquare.io/asset/starknet/0x0044bac3f28118ea1946963a1bc1dc6e3752e2ed1b355c0113fd8087d2db6b66/33"
              target="_blank"
              rel="noreferrer"
            >
              See it on Mintsquare
            </a>
          </p>
          <div className="h-20 relative mb-6 mt-10 hidden md:block pointer-events-none">
            <img
              src="/argent_x_pxls_banner.svg"
              className="absolute max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <div className="block md:hidden bg-white">
            <div className="p-6">
              <b>{participantsCount} wallets participated - WFT?</b>
            </div>
            <div className="border-black border-b mb-1" />
            <div className="border-black border-b mb-6" />
            <div className="px-6 pb-12">
              Together with Argent, we built the first ever on-chain giveaway on
              Starknet. {participantsCount} wallets participated, which is way
              beyond our craziest expectations. It proves once again that the
              Starknet ecosystem is striving!
              <br />
              <br />
              The winner will be anounced very soon on our{" "}
              <a
                href="https://twitter.com/PxlsWtf"
                target="_blank"
                rel="noreferrer"
              >
                Twitter account
              </a>
              .
            </div>
            <div className="border-black border-b mb-1 mt-6" />
            <div className="border-black border-b mb-6" />
            <div className="mb-6">
              <b>Making this tool opensource</b>
            </div>
            <div className="px-4 mb-12">
              This tool is now opensource. Any builder on Starknet can re-use it
              to engage their community. We believe this is the way to make it
              all together - have fun playing with it!
              <br />
              <Button
                text="Go to Github repo"
                action={() => {
                  window.open(
                    "https://github.com/nmalzieu/pxls-argent-giveaway"
                  );
                }}
                rainbow
                block
              />
            </div>
          </div>
          <div style={{ height: 700 }} className="hidden md:block">
            <Window
              style={{
                width: 525,
                padding: 42,
                margin: "auto",
                marginTop: 100,
              }}
            >
              <b>{participantsCount} wallets participated - WFT?</b>
              <div className="border-black border-b mb-1 mt-3" />
              <div className="border-black border-b mb-6" />
              <div>
                Together with Argent, we built the first ever on-chain giveaway
                on Starknet. {participantsCount} wallets participated, which is
                way beyond our craziest expectations. It proves once again that
                the Starknet ecosystem is striving!The winner will be anounced
                very soon on our Twitter account.
              </div>
              <div className="border-black border-b mb-1 mt-6" />
              <div className="border-black border-b mb-4" />
              <div>{statusComponent}</div>
            </Window>
          </div>
        </div>
      </div>
      <div className="bg-[#FF80E3] text-white pt-[70px] pb-8 text-center relative">
        <img
          src="/horizontalSeparator.svg"
          className="w-full absolute top-0 -translate-y-1/2"
        />
        <b className="pb-6 block">They participated</b>
        {participants.length === 0 && <div>Loading...</div>}
        {verifyingSignature === "done" && verifyingTweet === "done" && (
          <div className="max-w-[437px] mx-auto break-words pb-6 px-6">
            {address} (you)
          </div>
        )}
        {participants
          .filter((p) => {
            if (
              p.toLocaleLowerCase() === address &&
              verifyingSignature === "done" &&
              verifyingTweet === "done"
            ) {
              return false;
            }
            return true;
          })
          .map((p) => (
            <div
              key={p}
              className="max-w-[437px] mx-auto break-words pb-6 px-6"
            >
              {p}
            </div>
          ))}
        {participantsCount > 500 && (
          <div>And {participantsCount - 500} others!</div>
        )}
      </div>
      <div className="bg-white py-8">
        <img src="/argent_x_pxls.svg" className="block mx-auto" />
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: NextPageContext) => {
  return {
    props: {
      participantsCount: await prisma.signatures.count({
        where: {
          tweet: { not: null },
        },
      }),
    },
  };
};
