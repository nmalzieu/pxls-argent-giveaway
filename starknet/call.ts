import { Provider, RawCalldata } from "starknet";
import { BigNumberish, toBN } from "starknet/utils/number";

type CallContractParameters = {
  starknetNetwork: "mainnet" | "goerli";
  contractAddress: string;
  entrypoint: string;
  calldata?: any[];
};

const getRawCallData = (d: any): BigNumberish => {
  if ((typeof d === "string" || d instanceof String) && d.startsWith("0x")) {
    return toBN(d.slice(2), "hex").toString();
  } else if (!isNaN(d)) {
    return `${d}`;
  }
  return d;
};

export const callContract = async ({
  starknetNetwork,
  contractAddress,
  entrypoint,
  calldata,
}: CallContractParameters) => {
  const provider = new Provider({
    network: starknetNetwork === "mainnet" ? "mainnet-alpha" : "goerli-alpha",
  });
  const rawCalldata: RawCalldata = [];
  calldata?.forEach((d) => rawCalldata.push(getRawCallData(d)));
  const response = await provider.callContract({
    contractAddress,
    entrypoint,
    calldata: rawCalldata,
  });
  return response.result;
};
