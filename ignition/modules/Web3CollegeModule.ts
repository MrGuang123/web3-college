import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("Web3CollegeModule", (m) => {
  /**
   * Hardhat Ignition 使用账户的方式与普通脚本不同。
   * `m.getAccount(0)` 获取由当前网络提供的第一个账户。
   * 这个账户将成为所部署合约的所有者（owner）。
   */
  const initialOwner = m.getAccount(0);

  // 1. 部署 YDToken 合约
  // 参数 `[initialOwner]` 会被传递给 YDToken 合约的构造函数。
  const ydToken = m.contract("YDToken", [initialOwner]);

  // 2. 部署 CoursePlatform 合约
  // 我们将刚刚定义的 `ydToken` 合约实例作为参数传递给构造函数。
  // Ignition 能够理解这种依赖关系，并会确保先部署 `ydToken`。
  const coursePlatform = m.contract("CoursePlatform", [
    ydToken,
  ]);

  // 3. 部署 MockUSDC 合约，用于测试未来的DeFi集成功能
  const mockUsdc = m.contract("MockUSDC");

  // 模块返回一个包含所有已部署合约实例的对象。
  return { ydToken, coursePlatform, mockUsdc };
});
