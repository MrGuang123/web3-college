"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { contracts } from "@/lib/contracts";
import { parseEther } from "viem";

export const CreateCourseForm = () => {
  const { isConnected } = useAccount();
  const {
    writeContract,
    isPending,
    isSuccess,
    isError,
    error,
    data: hash,
  } = useWriteContract();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert("Please fill in all fields.");
      return;
    }

    writeContract({
      address: contracts.coursePlatform.address,
      abi: contracts.coursePlatform.abi,
      functionName: "createCourse",
      args: [
        title,
        "ipfs://placeholder", // Using a placeholder for metadata URL for now
        parseEther(price), // Convert YD amount to the smallest unit (like wei)
      ],
    });
  };

  if (!isConnected) {
    return (
      <p className="text-center text-yellow-600 bg-yellow-100 p-4 rounded-md">
        Please connect your wallet to create a course.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md"
    >
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Course Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Price (in YD tokens)
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          min="0.000001"
          step="any"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating..." : "Create Course"}
      </button>

      {isSuccess && (
        <div className="text-green-600 bg-green-100 p-3 rounded-md">
          <p>Course created successfully!</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            View on Etherscan
          </a>
        </div>
      )}
      {isError && (
        <div className="text-red-600 bg-red-100 p-3 rounded-md">
          <p>Error creating course:</p>
          <p className="text-sm break-words">
            {error?.message || "An unknown error occurred."}
          </p>
        </div>
      )}
    </form>
  );
};
