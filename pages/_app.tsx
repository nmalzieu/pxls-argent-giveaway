import "../styles/globals.css";
import type { AppProps } from "next/app";
import { StarknetConfig, InjectedConnector } from "@starknet-react/core";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const connectors = [new InjectedConnector({ options: { id: "argentX" } })];
  return (
    <StarknetConfig connectors={connectors}>
      <Head>
        <title>ArgentX x Pxls</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta property="og:url" content="https://argentx.pxls.wtf" />
        <meta property="og:title" content="ArgentX x Pxls" />
        <meta
          property="og:image"
          content="https://argentx.pxls.wtf/social_sharing.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <Component {...pageProps} />
    </StarknetConfig>
  );
}
