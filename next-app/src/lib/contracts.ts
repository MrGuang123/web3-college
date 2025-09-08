import coursePlatformArtifact from "../../../artifacts/contracts/CoursePlatform.sol/CoursePlatform.json";
import ydTokenArtifact from "../../../artifacts/contracts/YDToken.sol/YDToken.json";
import mockUsdcArtifact from "../../../artifacts/contracts/mocks/MockUSDC.sol/MockUSDC.json";

export const aavePoolAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * IMPORTANT:
 *
 * After deploying your contracts, you must update these addresses.
 * You can get them from the output of the command:
 * `npx hardhat ignition deploy ignition/modules/Web3CollegeModule.ts --network localhost`
 */
export const contracts = {
  coursePlatform: {
    address: "0x...", // TODO: Replace with your deployed CoursePlatform address
    abi: coursePlatformArtifact.abi,
  },
  ydToken: {
    address: "0x...", // TODO: Replace with your deployed YDToken address
    abi: ydTokenArtifact.abi,
  },
  mockUsdc: {
    address: "0x...", // TODO: Replace with your deployed MockUSDC address
    abi: mockUsdcArtifact.abi,
  },
} as const;

// AAVE Pool contract address on Sepolia testnet.
// For local testing, you would need to deploy a mock AAVE environment.
export const AAVE_POOL_ADDRESS =
  "0x6Ae43d3271ff6888e7Fc439772A20693AE912B2b";
