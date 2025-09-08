import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("Web3CollegeModule", (m) => {
  /**
   * Hardhat Ignition uses accounts differently than scripts.
   * `m.getAccount(0)` gets the first account provided by the network.
   * This will be the owner of the contracts.
   */
  const initialOwner = m.getAccount(0);

  // 1. Deploy the YDToken contract
  // The argument `[initialOwner]` is passed to the YDToken constructor.
  const ydToken = m.contract("YDToken", [initialOwner]);

  // 2. Deploy the CoursePlatform contract
  // We pass the address of the just-defined `ydToken` contract to the constructor.
  // Ignition understands this dependency and will deploy `ydToken` first.
  const coursePlatform = m.contract("CoursePlatform", [
    ydToken,
  ]);

  // 3. Deploy the MockUSDC contract for testing DeFi integration
  const mockUsdc = m.contract("MockUSDC");

  // The module returns an object with all deployed contracts.
  return { ydToken, coursePlatform, mockUsdc };
});
