"use client"; // This page now uses client-side hooks, so it must be a client component

import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { CourseList } from "./components/CourseList";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <header className="w-full max-w-7xl flex justify-between items-center p-4 fixed top-0 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50">
        <Link href="/" className="text-2xl font-bold">
          Web3 College
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/create-course"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Create Course
          </Link>
          <ConnectButton />
        </div>
      </header>

      <div className="mt-24 w-full max-w-7xl">
        <h2 className="text-3xl font-semibold mb-8">
          Available Courses
        </h2>
        <CourseList />
      </div>
    </main>
  );
}
