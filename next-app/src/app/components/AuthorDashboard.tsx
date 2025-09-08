"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import {
  contracts,
  AAVE_POOL_ADDRESS,
  aavePoolAbi,
} from "@/lib/contracts";
import { formatEther, formatUnits, parseUnits } from "viem";
import { useEffect, useState } from "react";
import { erc20Abi } from "viem";

export const AuthorDashboard = () => {
  const { address } = useAccount();
  const [supplyAmount, setSupplyAmount] = useState("");

  // --- Balances and Earnings ---
  const {
    data: earnings,
    isLoading: isLoadingEarnings,
    refetch: refetchEarnings,
  } = useReadContract({
    address: contracts.coursePlatform.address,
    abi: contracts.coursePlatform.abi,
    functionName: "authorEarnings",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: usdcBalance, refetch: refetchUsdcBalance } =
    useBalance({
      address,
      token: contracts.mockUsdc.address as `0x${string}`,
    });

  // --- Withdraw functionality ---
  const {
    data: withdrawHash,
    writeContract: withdraw,
    isPending: isWithdrawing,
  } = useWriteContract();
  const {
    isLoading: isConfirmingWithdrawal,
    isSuccess: isWithdrawSuccess,
  } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // --- Faucet functionality ---
  const {
    data: faucetHash,
    writeContract: getMockUsdc,
    isPending: isMinting,
  } = useWriteContract();
  const {
    isLoading: isConfirmingMint,
    isSuccess: isMintSuccess,
  } = useWaitForTransactionReceipt({ hash: faucetHash });

  // --- AAVE Functionality ---
  const {
    data: usdcAllowance,
    refetch: refetchUsdcAllowance,
  } = useReadContract({
    address: contracts.mockUsdc.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, AAVE_POOL_ADDRESS],
    query: { enabled: !!address },
  });
  const {
    data: approveHash,
    writeContract: approveAave,
    isPending: isApprovingAave,
  } = useWriteContract();
  const {
    isLoading: isConfirmingAaveApproval,
    isSuccess: isAaveApproveSuccess,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    data: supplyHash,
    writeContract: supplyAave,
    isPending: isSupplyingAave,
  } = useWriteContract();
  const {
    isLoading: isConfirmingAaveSupply,
    isSuccess: isAaveSupplySuccess,
  } = useWaitForTransactionReceipt({ hash: supplyHash });

  // --- Effects to refetch data after transactions ---
  useEffect(() => {
    if (isWithdrawSuccess) {
      refetchEarnings();
    }
    if (isMintSuccess) {
      refetchUsdcBalance();
    }
    if (isAaveApproveSuccess) {
      refetchUsdcAllowance();
    }
    if (isAaveSupplySuccess) {
      refetchUsdcBalance();
      refetchUsdcAllowance();
      setSupplyAmount("");
    }
  }, [
    isWithdrawSuccess,
    isMintSuccess,
    isAaveApproveSuccess,
    isAaveSupplySuccess,
    refetchEarnings,
    refetchUsdcBalance,
    refetchUsdcAllowance,
  ]);

  // --- Handlers ---
  const handleWithdraw = () => {
    withdraw({
      address: contracts.coursePlatform.address,
      abi: contracts.coursePlatform.abi,
      functionName: "withdrawFunds",
    });
  };

  const handleGetMockUsdc = () => {
    getMockUsdc({
      address: contracts.mockUsdc.address,
      abi: contracts.mockUsdc.abi,
      functionName: "mint",
      args: [address!, 1000], // Mint 1,000 mUSDC
    });
  };

  const handleApproveAave = () => {
    const amount = parseFloat(supplyAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    // mUSDC has 6 decimals
    const amountToApprove = parseUnits(supplyAmount, 6);
    approveAave({
      address: contracts.mockUsdc.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [AAVE_POOL_ADDRESS, amountToApprove],
    });
  };

  const handleSupplyAave = () => {
    const amount = parseFloat(supplyAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const amountToSupply = parseUnits(supplyAmount, 6);
    supplyAave({
      address: AAVE_POOL_ADDRESS,
      abi: aavePoolAbi,
      functionName: "supply",
      args: [
        contracts.mockUsdc.address,
        amountToSupply,
        address!,
        0,
      ],
    });
  };

  const hasEarnings =
    earnings !== undefined && (earnings as bigint) > 0n;
  const parsedSupplyAmount = parseUnits(
    supplyAmount || "0",
    6
  );
  const needsAaveApproval =
    usdcAllowance !== undefined &&
    usdcAllowance < parsedSupplyAmount;

  return (
    <div className="space-y-8">
      {/* Step 1: Withdraw Earnings */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-1">
          Step 1: Withdraw Your Earnings
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Withdraw your accumulated YD token earnings from
          the platform to your wallet.
        </p>

        {isLoadingEarnings ? (
          <p>Loading your earnings...</p>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-700 p-4 rounded-md">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Available to Withdraw
              </p>
              <p className="text-2xl font-bold">
                {formatEther((earnings || 0n) as bigint)} YD
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={
                !hasEarnings ||
                isWithdrawing ||
                isConfirmingWithdrawal
              }
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isWithdrawing || isConfirmingWithdrawal
                ? "Withdrawing..."
                : "Withdraw"}
            </button>
          </div>
        )}
        {isWithdrawSuccess && (
          <p className="text-green-600 mt-2">
            Withdrawal successful!
          </p>
        )}
      </section>

      {/* Step 2: Get Test USDC */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-1">
          Step 2: Get Test USDC (Faucet)
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          To interact with AAVE, you need stablecoins. This
          faucet will give you test USDC tokens on the local
          network.
        </p>
        <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-700 p-4 rounded-md">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your mUSDC Balance
            </p>
            <p className="text-2xl font-bold">
              {usdcBalance
                ? `${usdcBalance.formatted} mUSDC`
                : "0 mUSDC"}
            </p>
          </div>
          <button
            onClick={handleGetMockUsdc}
            disabled={isMinting || isConfirmingMint}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isMinting || isConfirmingMint
              ? "Minting..."
              : "Get 1,000 mUSDC"}
          </button>
        </div>
      </section>

      {/* Step 3: Supply to AAVE */}
      <section className="bg-white dark:bg-zinc-800/50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-1">
          Step 3: Supply to AAVE
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Supply your mUSDC to the AAVE lending protocol to
          start earning interest.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="supply-amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Amount to supply
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                name="supply-amount"
                id="supply-amount"
                className="block w-full flex-1 rounded-none rounded-l-md border-gray-300 bg-white dark:bg-zinc-700 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="0.0"
                value={supplyAmount}
                onChange={(e) =>
                  setSupplyAmount(e.target.value)
                }
              />
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 dark:bg-zinc-600 px-3 text-sm text-gray-500 dark:text-gray-300">
                mUSDC
              </span>
            </div>
          </div>

          {needsAaveApproval ? (
            <button
              onClick={handleApproveAave}
              disabled={
                isApprovingAave ||
                isConfirmingAaveApproval ||
                !supplyAmount
              }
              className="w-full px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
            >
              {isApprovingAave || isConfirmingAaveApproval
                ? "Approving..."
                : "Approve"}
            </button>
          ) : (
            <button
              onClick={handleSupplyAave}
              disabled={
                isSupplyingAave ||
                isConfirmingAaveSupply ||
                !supplyAmount ||
                (usdcBalance &&
                  parsedSupplyAmount > usdcBalance.value)
              }
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {isSupplyingAave || isConfirmingAaveSupply
                ? "Supplying..."
                : "Supply to AAVE"}
            </button>
          )}

          {isAaveSupplySuccess && (
            <p className="text-green-600 mt-2 text-center">
              Successfully supplied to AAVE!
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
