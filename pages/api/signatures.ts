import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const signatures = await prisma.signatures.findMany({
    where: {
      tweet: { not: null },
    },
    take: 500,
  });

  res.status(200).json({
    signatures: signatures.map((s: any) => s.wallet),
  });
}
