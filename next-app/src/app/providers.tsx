"use client";

import React, { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { SessionProvider } from "next-auth/react";
import { injected } from "wagmi/connectors";

// 手动创建配置
const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`
    ),
  },
  connectors: [
    injected({
      // dApp 元数据作为 injected 连接器的一部分提供
      // 这样钱包插件弹窗时会显示这些信息
      target: {
        id: "injected",
        name: "Web3 College",
        provider:
          typeof window !== "undefined"
            ? window.ethereum
            : undefined,
      },
    }),
  ],
});

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
          <ConnectKitProvider
            customTheme={{
              "--ck-connectbutton-background": "#373737",
              "--ck-connectbutton-border-radius": "8px",
            }}
          >
            {children}
          </ConnectKitProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
