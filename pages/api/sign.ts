import { typedData } from "starknet";
import type { NextApiRequest, NextApiResponse } from "next";
import messageToSign from "../../starknet/message";
import { verifySignature } from "../../starknet/verifySignature";
import { verifyArgentWallet } from "../../starknet/verifyArgentWallet";
import { prisma } from "../../prisma/client";
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(400).json({
    message: "The giveaway has ended",
  });
  return;
  // const body = req.body;
  // if (!body.account || !body.signature) {
  //   res.status(400).json({
  //     message: "Missing body: account, signature required",
  //   });
  //   return;
  // }

  // const messageHexHash = typedData.getMessageHash(messageToSign, body.account);
  // const { signatureValid, error } = await verifySignature(
  //   body.account,
  //   messageHexHash,
  //   body.signature,
  //   "mainnet"
  // );
  // if (!signatureValid) {
  //   return res.status(400).json({ message: "Signature is invalid", error });
  // }

  // const isArgent = await verifyArgentWallet(body.account, "mainnet");

  // if (!isArgent) {
  //   return res.status(400).json({
  //     message: "This wallet is not an Argent wallet",
  //     error: "NOT_ARGENT_WALLET",
  //   });
  // }

  // const wallet = body.account.toLowerCase();

  // const code = nanoid();

  // const signatureData = {
  //   wallet,
  //   code,
  // };

  // await prisma.signatures.upsert({
  //   where: { wallet: body.account.toLowerCase() },
  //   update: signatureData,
  //   create: signatureData,
  // });

  // res.status(200).json({ message: "Done", code });
}
