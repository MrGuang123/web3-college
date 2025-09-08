import { AuthorDashboard } from "@/app/components/AuthorDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl">
        <Link
          href="/profile"
          className="text-blue-500 hover:underline mb-8 block"
        >
          &larr; Back to Profile
        </Link>
        <h1 className="text-4xl font-bold mb-8">
          Author Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Manage your course earnings and put your funds to
          work with DeFi.
        </p>
        <AuthorDashboard />
      </div>
    </main>
  );
}
