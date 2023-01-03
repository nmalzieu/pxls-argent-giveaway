import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { prisma } from "../../prisma/client";

const tweetIDRegex = new RegExp("^https://twitter.com/(.*?)/status/(.*?)(/|$|\\?)");
const codeRegex = new RegExp("proof:(.*?)($|\\s)");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST endpoint" });
  }
  const { tweetURL } = req.body;
  if (!tweetURL) {
    return res.status(400).json({ error: "WRONG_URL" });
  }

  const match = tweetURL.match(tweetIDRegex);
  if (!match) {
    return res.status(400).json({ error: "WRONG_URL" });
  }
  const tweetId = match[2];

  const tweet = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
    headers: {
      Authorization:
        "Bearer AAAAAAAAAAAAAAAAAAAAAML2kQEAAAAADM5GS0snuBqGhIDKjZPFF3ZuYkw%3DOhaw0wIOnyIo35UvFwQndo2NE79By6RuNUrh0NW7UECSoBxtqd",
    },
  });

  const tweetContent = tweet.data?.data?.text;

  if (!tweetContent) {
    return res.status(400).json({ error: "WRONG_TWEET" });
  }

  const codeMatch = tweetContent.match(codeRegex);
  if (!codeMatch) {
    return res.status(400).json({ error: "WRONG_TWEET" });
  }

  const code = codeMatch[1];

  const signature = await prisma.signatures.findFirst({ where: { code } });

  if (!signature) {
    return res.status(400).json({ error: "WRONG_TWEET" });
  }

  if (!signature.tweet) {
    await prisma.signatures.update({
      where: { code },
      data: { tweet: tweetURL },
    });
  }

  res.status(200).json({ message: "OK" });
}
