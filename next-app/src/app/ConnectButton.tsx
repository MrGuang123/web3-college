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
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
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
