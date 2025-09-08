"use client";

import React, { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  ConnectKitProvider,
  getDefaultConfig,
} from "connectkit";
import { SessionProvider } from "next-auth/react";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [hardhat, sepolia],
    transports: {
      // RPC URL for each chain
      [hardhat.id]: http("http://127.0.0.1:8545"),
      [sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
      ),
    },

    // Required API Keys
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

    // dApp Information
    appName: "Web3 College",

    // Optional App Info
    appDescription:
      "A decentralized platform for online courses.",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

const queryClient = new QueryClient();

export const Web3Provider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ConnectKitProvider>
            {children}
          </ConnectKitProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
