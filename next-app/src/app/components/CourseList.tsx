"use client";

import { useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import { formatEther } from "viem";
import Link from "next/link";

// Define the type for a single course based on the contract's struct
type Course = {
  id: bigint;
  title: string;
  metadataUrl: string;
  price: bigint;
  author: `0x${string}`;
};

export const CourseList = () => {
  const {
    data: courses,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: contracts.coursePlatform.address,
    abi: contracts.coursePlatform.abi,
    functionName: "getAllCourses",
  });

  if (isLoading) {
    return <div>Loading courses...</div>;
  }

  if (isError) {
    console.error("Error fetching courses:", error);
    // A more user-friendly check for placeholder address
    if (contracts.coursePlatform.address === "0x...") {
      return (
        <div className="text-red-500">
          <p>
            Failed to fetch courses. Have you deployed the
            contracts and updated the address in
            `src/lib/contracts.ts`?
          </p>
        </div>
      );
    }
    return (
      <div className="text-red-500">
        Error fetching courses. Check the console for
        details.
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div>
        <p>No courses have been created yet.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {(courses as Course[]).map((course) => (
        <Link
          href={`/course/${course.id.toString()}`}
          key={course.id.toString()}
        >
          <div className="border p-4 rounded-lg shadow-md bg-gray-50 dark:bg-zinc-800/50 h-full flex flex-col justify-between hover:shadow-lg hover:border-blue-500 transition-all">
            <div>
              <h3 className="text-xl font-bold mb-2">
                {course.title}
              </h3>
              <p
                className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1"
                title={course.author}
              >
                Author: {course.author}
              </p>
            </div>
            <p className="text-lg font-semibold mt-4">
              {formatEther(course.price)} YD
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};
