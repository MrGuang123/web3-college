import { ProfileClient } from "@/app/components/ProfileClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // If the user is not logged in, redirect them to the home page.
  if (!session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="text-blue-500 hover:underline mb-8 block"
        >
          &larr; Back to Market
        </Link>
        <h1 className="text-4xl font-bold mb-8">
          Your Profile
        </h1>
        <ProfileClient session={session} />
      </div>
    </main>
  );
}
