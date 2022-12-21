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

type Props = {
  participants: string[];
};

const reveal = "XXX the XXth at XX:XXpm";

export default function Home({ participants }: Props) {
  const { address, status } = useAccount();
  const { chain } = useNetwork();

  const isMainnet = chain && chain.id === "0x534e5f4d41494e";

  const {
    connect,
    connectors,
    disconnect,
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

  const argentAvailable = useRef(false);

  useEffect(() => {
    const connector = connectors.find((c) => c.id() === "argentX");
    if (connector) {
      setArgentConnector(connector);
      argentAvailable.current = connector.available();
    } else {
      argentAvailable.current = false;
    }
  }, [connectors]);

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
    const textToTweet = `Super Pxls Lol ! code:${code}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToTweet)}`
    );
  }, [code]);

  let statusComponent = <div></div>;

  useEffect(() => {
    let interval: any = setInterval(() => {
      if (argentAvailable.current) {
        clearInterval(interval);
        interval = null;
      } else {
        refreshConnectors();
      }
    }, 1000);
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [refreshConnectors]);

  if (
    status === "disconnected" ||
    verifyingSignature === "notyet" ||
    verifyingSignature === "verifyingSignature"
  ) {
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
                  if (!argentAvailable) return;
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

  return (
    <>
      <div className="container text-center mx-auto">
        <img src="/logo.svg" className="mx-auto my-8" />
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
          Starknet people, we are giving away this masterpiece! As part of the
          Meet the Dapp series, we explained how to order an rtwrk on Pxls. We
          ordered this “Argent X Pxls” rtwrk and we’ll give it to one of you.
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
            <b>WTF? How do I get it?</b>
          </div>
          <div className="border-black border-b mb-1" />
          <div className="border-black border-b mb-6" />
          <div className="px-6 pb-12">
            You need to use an Argent X wallet on desktop in order to
            participate.
            <br />
            Go to <span className="underline">
              https://argentx.pxls.wtf/
            </span>{" "}
            on your computer.
            <br />
            <br />
            On {reveal} we’ll randomly pick the winner amongst participants.
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
            <b>WTF? How do I get it?</b>
            <div className="border-black border-b mb-1 mt-3" />
            <div className="border-black border-b mb-6" />
            <div>
              1/ Sign with your Argent X wallet
              <br />
              2/ Tweet it
              <br />
              3/ Verify your tweet
              <br />
              <br />
              On {reveal} we’ll randomly pick the winner amongst participants.
            </div>
            <div className="border-black border-b mb-1 mt-6" />
            <div className="border-black border-b mb-4" />
            <div>{statusComponent}</div>
          </Window>
        </div>
      </div>
      <div className="bg-[#FF80E3] text-white pt-[70px] pb-8 text-center relative">
        <img
          src="/horizontalSeparator.svg"
          className="w-full absolute top-0 -translate-y-1/2"
        />
        <b className="pb-6 block">They participated</b>
        {verifyingSignature === "done" && verifyingTweet === "done" && (
          <div className="max-w-[437px] mx-auto break-words pb-6 px-6">
            {address} (you)
          </div>
        )}
        {participants.map((p) => (
          <div key={p} className="max-w-[437px] mx-auto break-words pb-6 px-6">
            {p}
          </div>
        ))}
      </div>
      <div className="bg-white py-8">
        <img src="/argent_x_pxls.svg" className="block mx-auto" />
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: NextPageContext) => {
  const signatures = await prisma.signatures.findMany({
    where: {
      tweet: { not: null },
    },
  });
  return {
    props: {
      participants: signatures.map((s: any) => s.wallet),
    },
  };
};
