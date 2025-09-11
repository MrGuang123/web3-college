"use client";

import { Session } from "next-auth";
import { useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import { useEffect, useState } from "react";
import Link from "next/link";

export const ProfileClient = ({
  session,
}: {
  session: Session & { address?: string };
}) => {
  const [nickname, setNickname] = useState("");
  const [currentNickname, setCurrentNickname] =
    useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Fetch enrolled courses from the smart contract
  const {
    data: enrolledCourses,
    isLoading: isLoadingCourses,
  } = useReadContract({
    address: contracts.coursePlatform.address,
    abi: contracts.coursePlatform.abi,
    functionName: "getEnrolledCourses",
    args: [session.address!],
    query: { enabled: !!session.address },
  });

  // Fetch initial nickname from our API
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/profile");
        if (!response.ok)
          throw new Error("Failed to fetch profile");
        const data = await response.json();
        setNickname(data.nickname || "");
        setCurrentNickname(data.nickname || "");
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("未知错误");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateNickname = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Failed to update nickname"
        );
      }
      const data = await response.json();
      setCurrentNickname(data.nickname);
      alert("Nickname updated successfully!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("未知错误");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Nickname Section */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">
          Your Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your wallet address:{" "}
          <span className="font-mono">
            {session.address}
          </span>
        </p>

        {isLoading ? (
          <p>Loading nickname...</p>
        ) : (
          <form
            onSubmit={handleUpdateNickname}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) =>
                  setNickname(e.target.value)
                }
                className="mt-1 block w-full md:w-1/2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={
                isUpdating || nickname === currentNickname
              }
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
            >
              {isUpdating ? "Saving..." : "Save Nickname"}
            </button>
            {error && (
              <p className="text-red-500 mt-2">{error}</p>
            )}
          </form>
        )}
      </section>

      {/* Author Dashboard Link Section */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">
          Author Zone
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Manage your created courses and withdraw your
          earnings.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Go to Author Dashboard
        </Link>
      </section>

      {/* Enrolled Courses Section */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">
          Your Enrolled Courses
        </h2>
        {isLoadingCourses ? (
          <p>Loading your courses...</p>
        ) : (
          <div>
            {enrolledCourses &&
            (enrolledCourses as bigint[]).length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {(enrolledCourses as bigint[]).map(
                  (courseId) => (
                    <li key={courseId.toString()}>
                      Course ID: {courseId.toString()}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                You have not enrolled in any courses yet.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
