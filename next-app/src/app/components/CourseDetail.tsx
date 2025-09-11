"use client";

import Link from "next/link";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contracts } from "@/lib/contracts";
import { formatEther, parseEther } from "viem";
import { useEffect } from "react";

type Course = {
  id: bigint;
  title: string;
  metadataUrl: string;
  price: bigint;
  author: `0x${string}`;
};

export const CourseDetail = ({
  courseId,
}: {
  courseId: bigint;
}) => {
  const { address: userAddress, isConnected } =
    useAccount();

  // --- Contract Reads ---
  const { data: course, isLoading: isLoadingCourse } =
    useReadContract({
      address: contracts.coursePlatform.address,
      abi: contracts.coursePlatform.abi,
      functionName: "courses",
      args: [courseId],
    });

  const { data: isEnrolled, refetch: refetchEnrollment } =
    useReadContract({
      address: contracts.coursePlatform.address,
      abi: contracts.coursePlatform.abi,
      functionName: "studentEnrollments",
      args: [courseId, userAddress!],
      query: { enabled: isConnected },
    });

  const { data: allowance, refetch: refetchAllowance } =
    useReadContract({
      address: contracts.ydToken.address,
      abi: contracts.ydToken.abi,
      functionName: "allowance",
      args: [
        userAddress!,
        contracts.coursePlatform.address,
      ],
      query: { enabled: isConnected && !!course },
    });

  // --- Contract Writes ---
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
    isSuccess: isApproveSuccess,
  } = useWriteContract();
  const {
    writeContract: buyCourse,
    data: buyCourseHash,
    isPending: isBuying,
    isSuccess: isBuySuccess,
  } = useWriteContract();

  // --- Transaction Receipts ---
  const { isLoading: isConfirmingApproval } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isConfirmingPurchase } =
    useWaitForTransactionReceipt({ hash: buyCourseHash });

  const courseDetails = course as Course | undefined;
  const needsApproval =
    isConnected &&
    courseDetails &&
    allowance !== undefined &&
    (allowance as number) < courseDetails.price;

  // --- Effects ---
  // When an approval is confirmed, refetch the allowance to update the UI
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // When a purchase is confirmed, refetch enrollment status
  useEffect(() => {
    if (isBuySuccess) {
      refetchEnrollment();
    }
  }, [isBuySuccess, refetchEnrollment]);

  // --- Handlers ---
  const handleApprove = () => {
    if (!courseDetails) return;
    approve({
      address: contracts.ydToken.address,
      abi: contracts.ydToken.abi,
      functionName: "approve",
      args: [
        contracts.coursePlatform.address,
        courseDetails.price,
      ],
    });
  };

  const handleBuyCourse = () => {
    if (!courseDetails) return;
    buyCourse({
      address: contracts.coursePlatform.address,
      abi: contracts.coursePlatform.abi,
      functionName: "buyCourse",
      args: [courseId],
    });
  };

  // --- Render Logic ---
  if (isLoadingCourse)
    return <div>Loading course details...</div>;
  if (
    !courseDetails ||
    courseDetails.author ===
      "0x0000000000000000000000000000000000000000"
  )
    return <div>Course not found.</div>;

  const isProcessing =
    isApproving ||
    isConfirmingApproval ||
    isBuying ||
    isConfirmingPurchase;

  return (
    <div>
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-8 block"
      >
        &larr; Back to Market
      </Link>

      <div className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4">
          {courseDetails.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          by{" "}
          <span className="font-mono">
            {courseDetails.author}
          </span>
        </p>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8">
          {formatEther(courseDetails.price)} YD
        </p>

        {isConnected && !!isEnrolled && (
          <div className="bg-green-100 text-green-800 p-4 rounded-md text-center font-semibold">
            You are enrolled in this course!
          </div>
        )}

        {isConnected && !isEnrolled && (
          <div className="space-y-4">
            {needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
              >
                {isApproving || isConfirmingApproval
                  ? "Approving..."
                  : `Step 1: Approve ${formatEther(
                      courseDetails.price
                    )} YD`}
              </button>
            ) : (
              <button
                onClick={handleBuyCourse}
                disabled={isProcessing}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
              >
                {isBuying || isConfirmingPurchase
                  ? "Purchasing..."
                  : "Step 2: Buy Course"}
              </button>
            )}
          </div>
        )}

        {!isConnected && (
          <p className="text-center text-yellow-600 bg-yellow-100 p-4 rounded-md">
            Please connect your wallet to purchase this
            course.
          </p>
        )}

        {(isConfirmingApproval || isConfirmingPurchase) && (
          <p className="text-center mt-4">
            Waiting for transaction confirmation...
          </p>
        )}
      </div>
    </div>
  );
};
