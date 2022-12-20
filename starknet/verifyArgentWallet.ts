import { callContract } from "./call";

export const verifyArgentWallet = async (
  accountAddress: string,
  starknetNetwork: string
): Promise<boolean> => {
  // We can verify this message hash against the signature generated in the frontend
  // by calling the is_valid_signature method on the Account contract
  try {
    const interface1 = await callContract({
      starknetNetwork: starknetNetwork === "mainnet" ? "mainnet" : "goerli",
      contractAddress: accountAddress,
      entrypoint: "supportsInterface",
      calldata: ["0x3943f10f"],
    });
    const interface2 = await callContract({
      starknetNetwork: starknetNetwork === "mainnet" ? "mainnet" : "goerli",
      contractAddress: accountAddress,
      entrypoint: "supportsInterface",
      calldata: ["0xf10dbd44"],
    });

    const isWallet = interface1[0] === "0x1" || interface2[0] === "0x1";

    if (!isWallet) return false;

    const name = await callContract({
      starknetNetwork: starknetNetwork === "mainnet" ? "mainnet" : "goerli",
      contractAddress: accountAddress,
      entrypoint: "getName",
      calldata: [],
    });

    const isArgent = name[0] === "0x417267656e744163636f756e74";

    if (!isArgent) return false;

    return true;
  } catch (e: any) {
    console.log(e);
    return false;
  }
};
