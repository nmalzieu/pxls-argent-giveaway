import { callContract } from "./call";

type SignatureVerify = {
  signatureValid: boolean;
  error?: string;
};

export const verifySignature = async (
  accountAddress: string,
  hexHash: string,
  signature: string[],
  starknetNetwork: string
): Promise<SignatureVerify> => {
  // We can verify this message hash against the signature generated in the frontend
  // by calling the is_valid_signature method on the Account contract
  try {
    const result = await callContract({
      starknetNetwork: starknetNetwork === "mainnet" ? "mainnet" : "goerli",
      contractAddress: accountAddress,
      entrypoint: "is_valid_signature",
      calldata: [hexHash, `${signature.length}`, ...signature],
    });

    const signatureValid = result[0] === "0x1";

    return { signatureValid };
  } catch (e: any) {
    console.log("Error while verifying signature for");
    console.log({ accountAddress, hexHash, signature, starknetNetwork });
    console.log(e);
    return { signatureValid: false, error: e.errorCode || e.message };
  }
};
