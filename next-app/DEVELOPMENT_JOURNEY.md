# Web3 大学 DApp 开发全流程文档 (详细版)

本文档详细记录了 "Web3 大学" 去中心化应用从概念到实现的全过程。它不仅是一个总结，更是一份包含了技术决策、代码实现细节和问题解决的详细开发日志。

## 1. 项目初始化与架构

项目启动时，我们确定了清晰、主流的 monorepo-style 结构，将两个核心部分整合在同一代码库中：

- **根目录**: 作为 Hardhat 项目，负责所有智能合约的开发、测试和部署 (`contracts/`, `ignition/`, `hardhat.config.js`)。
- **`next-app/`**: 作为 Next.js 14+ 前端项目，采用 App Router 结构 (`src/app/`)，负责所有用户交互界面。

在架构上，我们采纳了**全栈 Next.js 架构**。我们利用 Next.js 的 API Routes (`src/app/api/`) 来处理所有必要的后端逻辑（如用户认证、链下数据存储），这使得我们无需配置和维护一个独立的后端服务器，极大地简化了开发和部署流程。

## 2. 智能合约开发 (Hardhat)

合约是整个 DApp 的链上核心，我们按照功能设计了两个核心合约。

### 2.1. `YDToken.sol`

- **目的**: 创建平台的官方 ERC20 代币，作为课程交易的媒介。
- **技术实现**:
  - 继承自 OpenZeppelin 的 `ERC20.sol` 标准实现，获得了所有基础功能 (`transfer`, `approve` 等)。
  - 继承自 `Ownable.sol`，为合约添加了所有权管理功能，便于未来可能的功能升级（如增发）。
- **核心逻辑**: 合约的 `constructor` 在部署时被调用，它会为部署者地址（即平台方）一次性铸造 (mint) 10 亿枚 `YD` 代币作为初始总供应量。

### 2.2. `CoursePlatform.sol`

- **目的**: 平台的核心业务逻辑合约，负责管理课程的整个生命周期。
- **核心状态变量**:
  - `ydToken`: 存储 `YDToken` 的合约地址，以便进行代币交互。
  - `courses`: 一个 `mapping (uint => Course)`，用于存储每个课程的详细信息（ID, 标题, 价格, 作者等）。
  - `studentEnrollments`: 一个嵌套 `mapping (uint => mapping(address => bool))`，高效地记录某个学生是否购买了某门课程。
  - `authorEarnings`: 一个 `mapping (address => uint)`，用于追踪每位课程作者通过销售课程累积的 `YD` 代币收入。
- **核心函数**:
  - `createCourse()`: 允许任何地址（课程作者）调用此函数，将新课程的信息写入 `courses` mapping。
  - `buyCourse()`: 处理学生购买课程的逻辑。它会先通过 `ydToken.transferFrom` 将学生账户的代币转移到本合约，然后更新 `studentEnrollments` 和 `authorEarnings`。
  - `withdrawFunds()`: 允许课程作者调用，将他们在 `authorEarnings` 中记录的收入提取到自己的钱包。
- **安全性**: 关键的资金转移函数 (`buyCourse`, `withdrawFunds`) 都被标记为 `nonReentrant`，这是通过继承 OpenZeppelin 的 `ReentrancyGuard.sol` 实现的，能有效防止重入攻击。

### 2.3. 编译与部署

- **编译**: 使用 `npx hardhat compile`。在此过程中，我们遇到了一个编译错误：`Error HHE902: The file security/ReentrancyGuard.sol doesn't exist`。我们迅速定位到这是由于 OpenZeppelin v5 版本的文件结构调整所致，通过将导入路径从 `security/` 修改为 `utils/`，成功解决了问题。
- **部署**: 我们遵循了 Hardhat 的最佳实践，从传统的 `scripts/deploy.js` 迁移到了现代化的 **Hardhat Ignition** 部署方案。
  - **原因**: Ignition 提供了更健壮的部署体验，它具有幂等性，能够在部署失败时从中断处恢复，并能更好地管理合约间的复杂依赖。
  - **实现**: 我们创建了 `ignition/modules/Deploy.js` 模块。在该模块中：
    1. 首先部署 `YDToken` 合约。
    2. 然后将已部署的 `ydToken` 实例的地址，作为 `constructor` 参数传递给 `CoursePlatform` 合约进行部署。Ignition 会自动处理这个依赖关系，确保部署顺序的正确性。

## 3. 前端开发 (Next.js)

前端的开发过程是迭代式的，我们一步步构建出完整的用户体验。

### 阶段一：Web3 环境与钱包连接

1.  **依赖安装**: 项目启动时，我们安装了 Web3 前端开发的核心套件：`wagmi` (用于 React Hooks)、`viem` (轻量级的以太坊接口) 和 `connectkit` (提供美观的钱包连接 UI)。
2.  **Provider 配置 (`src/app/providers.tsx`)**: 这是整个 DApp 的 Web3 功能入口。我们创建了一个 `Web3Provider` 组件，它封装了 `WagmiProvider` 和 `ConnectKitProvider`。在这里，我们配置了应用需要连接的区块链网络（Hardhat 本地网络和 Sepolia 测试网）以及相应的 RPC URL。
3.  **UI 集成**: 我们创建了一个简单的 `ConnectButton.tsx` 组件，并将其放置在主页 `page.tsx` 的头部，用户可以通过它调起 ConnectKit 的模态框来连接他们的 MetaMask 钱包。

### 阶段二：核心合约交互 (课程市场)

1.  **合约配置 (`src/lib/contracts.ts`)**: 为了避免在代码中硬编码合约地址和 ABI，我们创建了一个中心化的配置文件。这个文件从 Hardhat 的编译产物 (`artifacts/`) 中导入合约的 ABI，并预留了位置用于填写部署后的合约地址。这成为了前端与合约交互的“单一事实来源”。
2.  **展示课程 (`CourseList.tsx`)**:
    - 使用 `wagmi` 提供的 `useReadContract` hook 来调用 `CoursePlatform` 合约的 `getAllCourses` 视图函数。这个 hook 极大地简化了从链上读取数据的过程。
    - 该组件优雅地处理了各种 UI 状态：显示“加载中...”的提示、在获取失败时显示错误信息（并智能地提示用户检查合约地址是否已配置）、以及在没有课程时显示“暂无课程”的消息。
3.  **创建课程 (`CreateCourseForm.tsx`)**:
    - 使用 `wagmi` 的 `useWriteContract` hook 来调用 `createCourse` 函数，实现向区块链写入数据。
    - 我们使用 `viem` 的 `parseEther` 工具函数，将用户输入的价格（如 "0.1" YD）转换为合约能理解的最小单位。
    - 为了提升用户体验，我们追踪了 `useWriteContract` 返回的状态（`isPending`, `isSuccess`, `isError`），在表单提交按钮和提示信息上实时反馈交易的进展。
4.  **购买课程 (`CourseDetail.tsx`)**:
    - 这是最复杂的交互组件，它完美地展示了 `wagmi` hooks 组合使用的强大能力。
    - **数据获取**: 组件加载时，它会并行发起三个 `useReadContract` 调用：获取课程详情、检查当前用户是否已购买该课程、以及检查用户授权给平台的 `YDToken` 额度 (`allowance`)。
    - **智能购买流程**:
      - 按钮的显示逻辑是动态的。它会比较课程价格和 `allowance` 的值。如果 `allowance` 不足，按钮会显示为“步骤 1: 授权”。
      - 用户点击授权后，`useWriteContract` 会被调用以执行 `approve` 函数。
      - 我们使用 `useWaitForTransactionReceipt` hook 来监听授权交易是否成功上链。交易成功后，`useEffect` 会被触发，自动重新获取 `allowance` 数据。
      - `allowance` 数据更新后，UI 会自动重新渲染，此时按钮会变为“步骤 2: 购买”。用户点击即可调用 `buyCourse` 函数完成购买。
    - 这个自动化的两步流程为用户提供了清晰、无缝的购买体验。

### 阶段三：用户认证与个人中心

1.  **认证方案**: 我们采纳了 **Sign-In with Ethereum (SIWE)**，这是一个无需密码、利用钱包私钥签名来验证用户身份的安全标准。我们使用 `next-auth` 库来集成 SIWE 并管理用户会话。
2.  **后端实现**:
    - **本地数据库 (`db.json`)**: 我们创建了一个简单的 JSON 文件来存储用户的链下数据（昵称），通过用户的钱包地址作为键进行索引。
    - **认证 API (`/api/auth/[...nextauth]/route.ts`)**: 这是 `NextAuth.js` 的核心。我们配置了 `CredentialsProvider`，其 `authorize` 函数的逻辑是：
      1. 接收前端发来的签名和原始消息。
      2. 使用 `siwe` 库来验证签名的有效性。
      3. 验证成功后，为该用户创建一个加密的 JWT 会话，并将用户的钱包地址存储在会话中。
    - **个人资料 API (`/api/profile/route.ts`)**: 我们创建了两个受保护的接口：
      - `GET`: 使用 `getServerSession` 检查请求是否来自已认证的用户，然后从 `db.json` 读取并返回该用户的昵称。
      - `POST`: 同样检查会话，然后安全地接收新昵称并更新到 `db.json`。
3.  **前端实现**:
    - **个人中心页 (`/profile`)**: 这是一个混合页面。服务器端组件 (`page.tsx`) 首先检查用户会话，如果不存在则直接重定向到主页。客户端组件 (`ProfileClient.tsx`) 则负责与后端的 `/api/profile` 接口交互来获取和更新昵称，并同时从链上获取用户已购买的课程列表。
    - **`ConnectButton` 最终形态**: 我们对连接按钮进行了彻底的重构，使其成为一个完整的认证状态管理器：
      - **状态 1 (未连接)**: 显示 ConnectKit 的连接按钮。
      - **状态 2 (已连接但未登录)**: 显示 "Sign In with Wallet" 按钮，点击后触发 SIWE 签名流程。
      - **状态 3 (已登录)**: 显示用户的头像（链接到个人资料页）和一个 "Sign Out" 按钮。

## 4. 完整运行流程

1.  **启动本地节点**: `npx hardhat node`
2.  **部署合约**: `npx hardhat ignition deploy ignition/modules/Deploy.js --network localhost`
3.  **配置前端**:
    - 将部署地址填入 `next-app/src/lib/contracts.ts`。
    - 在 `next-app/.env.local` 中填入 `NEXT_PUBLIC_...` 和 `NEXTAUTH_SECRET`。
4.  **安装依赖**: `npm install` (在根目录和 `next-app` 目录分别执行)。
5.  **启动应用**: `npm run dev` (在 `next-app` 目录)。
