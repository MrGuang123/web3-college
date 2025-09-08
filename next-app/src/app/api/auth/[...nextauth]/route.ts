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

          // This is a workaround for NextAuth version 5 to get the nonce
          // In a real app, you'd want a more robust way to get the nonce
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
