/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message || "{}")
          );

          // 这是 NextAuth 第5版中获取 nonce 的一种变通方法
          // 在一个真实的应用中，你想要一个更健壮的方式来获取 nonce
          const nonce = await getCsrfToken({
            req: { headers: req.headers },
          });

          const result = await siwe.verify({
            signature: credentials?.signature || "",
            nonce,
          });

          if (result.success) {
            return {
              id: siwe.address,
            };
          }
          return null;
        } catch (e) {
          console.error(e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: any;
      token: any;
    }) {
      session.address = token.sub;
      session.user.name = token.sub;
      session.user.image = `https://effigy.im/a/${token.sub}.svg`;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // A secret is required for JWT encryption
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
