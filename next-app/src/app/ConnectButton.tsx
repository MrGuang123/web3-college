"use client";

import { ConnectKitButton } from "connectkit";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
} from "wagmi";
import {
  useSession,
  signIn,
  signOut,
} from "next-auth/react";
import { SiweMessage } from "siwe";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export const ConnectButton = () => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: session, status } = useSession();
  const { signMessageAsync } = useSignMessage();
  const [isSigning, setIsSigning] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigning(true);
      // 用于创建和解析符合 EIP-4361 (Sign-In with Ethereum) 标准的签名消息
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement:
          "Sign in to Web3 College to manage your profile.",
        uri: window.location.origin,
        version: "1",
        chainId: chainId,
        // nonce is handled by NextAuth
      });
      // 提供 signMessageAsync 函数。这是实现“通过以太坊登录 (Sign-In with Ethereum, SIWE)” 的核心。
      // 调用它会请求用户的钱包对一条特定的消息进行签名。这个签名就像是用户的数字密码，
      // 可以证明消息确实来自于持有该钱包私钥的人，且无法被伪造。
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
      // 一个函数，用于触发登录流程。在我们的代码中，它调用的是我们在后端 API
      //  ([...nextauth]/route.ts) 中定义的 credentials 提供者。
      // 我们会把钱包签名后的消息和签名本身作为“凭证”传给它。
      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
      });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleSignOut = () => {
    signOut({ redirect: false });
    // We also disconnect the wallet
    disconnect();
  };

  // If wallet is connected but user is not signed into the app
  if (isConnected && status === "unauthenticated") {
    return (
      <button
        onClick={handleSignIn}
        disabled={isSigning}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSigning
          ? "Signing in..."
          : "Sign In with Wallet"}
      </button>
    );
  }

  // If user is signed in
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Image
            src={session.user?.image || ""}
            alt="User profile picture"
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Default state: connect wallet button
  return <ConnectKitButton />;
};
