import "../styles/globals.css";
import type { AppProps } from "next/app";
import { StarknetConfig, InjectedConnector } from "@starknet-react/core";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  const connectors = [new InjectedConnector({ options: { id: "argentX" } })];
  return (
    <StarknetConfig connectors={connectors}>
      <Head>
        <title>Pxls x Argent</title>
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
      </Head>
      <Component {...pageProps} />
    </StarknetConfig>
  );
}
