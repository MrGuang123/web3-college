# Web3 大学项目：需求与开发文档

## 1. 项目概述

Web3 大学是一个去中心化的在线课程平台。课程作者可以创建并销售自己的课程，学生可以使用平台的原生代币（YD Token）购买课程。平台旨在利用区块链技术确保交易的透明性、资产的所有权以及作者资金的自主管理能力。

- **核心代币**: YD Token (ERC20)
- **核心业务**: 课程的创建、购买与授权
- **特色功能**: 作者资金可通过 DeFi 协议（如 AAVE）进行理财
- **技术栈**: Solidity (智能合约), Next.js (前端 + 轻量后端), Ethers.js/Viem (与区块链交互), MetaMask (钱包与签名)

## 2. 系统架构

项目将采用前后端分离但整合在同一代码库的架构。

- **智能合约 (Contracts)**: 负责所有链上核心逻辑，包括 YD 代币、课程的创建与购买、资金转移等。使用 Hardhat 或 Foundry 进行开发和测试。
- **前端 (Frontend)**: 基于 Next.js 开发，作为用户与 DApp 交互的主要入口。负责展示课程、连接钱包、发起交易、管理个人中心等。
- **后端 (Backend Logic)**: 利用 Next.js 的 API Routes 实现轻量级后端功能。主要用于处理需要中心化服务器或保护 API 密钥的逻辑，特别是安全的身份验证和获取用户数据。**无需独立的 `backend` 服务**。

## 3. 功能模块详细分解

---

### 模块一：平台核心合约与代币

**需求点**: 1. 合约开发者部署平台 YD 代币，开发课程相关合约。

**用户故事**:

- 作为平台运营方，我希望能部署一种名为 "YD Token" 的 ERC20 代币作为平台的官方货币。
- 作为平台运营方，我希望能部署一个核心的课程平台合约，用于管理所有课程的生命周期和交易。

**技术实现方案**:

1.  **`YDToken.sol` (ERC20 合约)**

    - 标准: 遵循 ERC20 标准。
    - 功能: `transfer`, `approve`, `transferFrom`, `balanceOf` 等。
    - 特性:
      - 可以考虑使用 OpenZeppelin 的 ERC20 合约模板。
      - 设置固定的总供应量，并在部署时将全部代币铸造给部署者（平台方）。
      - `name()`: "YD Token"
      - `symbol()`: "YD"

2.  **`CoursePlatform.sol` (核心平台合约)**
    - **状态变量**:
      - `address public ydTokenAddress`: YD 代幣合約地址。
      - `address public owner`: 合约所有者，拥有管理权限。
      - `struct Course`: 用于存储课程信息。
        - `uint id`: 课程唯一 ID。
        - `string title`: 课程标题。
        - `string metadataUrl`: 课程详细描述、封面的链下存储地址（如 IPFS）。
        - `uint price`: 课程价格（以 YD Token 为单位）。
        - `address payable author`: 课程作者地址。
      - `mapping(uint => Course) public courses`: 课程 ID 到课程详情的映射。
      - `mapping(uint => mapping(address => bool)) public studentEnrollments`: 记录学生是否购买了某个课程 (`courseId => studentAddress => isEnrolled`)。
      - `uint public nextCourseId`: 用于生成自增的课程 ID。
    - **核心函数**:
      - `createCourse(string memory _title, string memory _metadataUrl, uint _price)`: 供课程作者调用，用于创建新课程。
      - `buyCourse(uint _courseId)`: 供学生调用，用于购买课程。
      - `withdrawFunds()`: 供课程作者调用，提取自己课程收入的 YD 代币。
      - `getEnrolledCourses(address _student)`: (视图函数) 获取某学生已购买的所有课程 ID。
    - **事件 (Events)**:
      - `CourseCreated(uint indexed courseId, address indexed author, uint price)`
      - `CoursePurchased(uint indexed courseId, address indexed student, address indexed author)`

---

### 模块二：课程创建

**需求点**: 2. 创建课程作者创建课程制定课程价格。

**用户故事**:

- 作为一名课程作者，我希望能在一个表单中填写课程的标题、描述、封面等信息，并设定一个以 YD 代币计价的价格，然后将它发布到平台上。

**技术实现方案**:

1.  **前端 (Next.js)**:
    - 创建一个 `/create-course` 页面。
    - 页面包含一个表单，字段包括：课程标题、课程描述（富文本）、封面图片上传、课程价格（YD）。
    - **流程**:
      1.  用户填写表单。
      2.  点击“发布”后，首先将课程的描述和封面等元数据上传到 IPFS，并获取返回的 `metadataUrl`。
      3.  引导用户钱包发起交易，调用 `CoursePlatform.sol` 合约的 `createCourse` 函数，传入标题、IPFS 的 `metadataUrl` 和价格。
      4.  监听交易状态，成功后提示用户并跳转到课程市场页面。

---

### 模块三：课程购买与授权

**需求点**: 3. 购买课程 并进行课程授权。

**用户故事**:

- 作为一名学生，我希望能浏览平台上的所有课程。
- 作为一名学生，我希望能使用我的 YD 代币购买我感兴趣的课程。
- 作为一名学生，购买课程后，我应该能立即获得访问课程内容的权限。

**技术实现方案**:

1.  **前端 (Next.js)**:
    - **课程市场页 (`/market`)**:
      - 从 `CoursePlatform` 合约读取所有 `Course` 信息并展示。
      - 显示课程标题、作者、价格等。
    - **课程详情页 (`/course/[id]`)**:
      - 显示单个课程的详细信息（从 IPFS 加载 `metadataUrl`）。
      - 如果用户未购买此课程，显示 "购买" 按钮。
      - **购买流程**:
        1.  点击 "购买" 按钮。
        2.  **步骤一 (Approve)**: 引导用户调用 `YDToken.sol` 的 `approve` 方法，授权 `CoursePlatform` 合约可以从用户钱包中划转指定数量的 YD 代币。
        3.  **步骤二 (Buy)**: `approve` 交易成功后，立即引导用户调用 `CoursePlatform.sol` 的 `buyCourse` 方法，传入课程 ID。
        4.  合约内部会完成 YD 代币的转移，并将学生地址记录到 `studentEnrollments` 中。
    - **课程内容访问**:
      - 在课程详情页，通过读取 `studentEnrollments` mapping 来判断当前连接钱包的用户是否已购买该课程。
      - 如果已购买，则显示课程内容（视频、文章等）；否则隐藏。

---

### 模块四：作者资金管理 (DeFi 集成)

**需求点**: 4. 创建课程作者将 YD 币兑换为 ETH 再兑换为 USDT 质押进 AAVE 进行理财。

**用户故事**:

- 作为课程作者，我希望可以将我赚取的 YD 代币方便地兑换成主流稳定币（如 USDT），并存入 AAVE 等借贷协议中赚取利息。

**技术实现方案**:

这是一个复杂的多步骤 DeFi 操作，不建议通过单一合约完成。最佳实践是在前端引导用户分步完成。

1.  **前端 (Next.js) - 作者仪表盘页面 (`/dashboard/author`)**:
    - 显示作者的总收入（YD Token）。
    - 提供一个 "资金管理" 或 "理财" 入口。
    - **流程**:
      1.  **提现**: 首先，作者需要调用 `CoursePlatform.sol` 的 `withdrawFunds()` 将其在平台合约中的 YD 代币收入提取到自己的钱包。
      2.  **兑换 YD -> WETH**: 集成 Uniswap V3 (或其他 DEX) 的 SDK 或前端路由。引导用户将 YD 兑换为 WETH。
      3.  **兑换 WETH -> USDT**: 再次使用 Uniswap，引导用户将 WETH 兑换为 USDT。
      4.  **质押到 AAVE**:
          - 与 AAVE V3 的 `Pool` 合约进行交互。
          - 参考 AAVE 官方文档提供的合约地址 (例如，Sepolia 测试网: `0x6Ae43d3271ff6888e7Fc439772A20693AE912B2b`)。
          - **步骤一 (Approve)**: 引导用户调用 USDT 合约的 `approve` 方法，授权 AAVE 的 `Pool` 合约可划转 USDT。
          - **步骤二 (Supply)**: `approve` 成功后，调用 AAVE `Pool` 合约的 `supply()` 方法，将 USDT 存入。

---

### 模块五：用户个人中心与安全认证

**需求点**: 5. 用户个人中心 通过 MetaMask 的签名机制 实现名称修改+安全的获取已经购买的课程详情。

**用户故事**:

- 作为一名用户，我希望能有一个个人中心页面，在里面可以修改我的昵称。
- 作为一名用户，我希望能在个人中心安全地看到我所有已购买课程的列表。

**技术实现方案**:

此功能采用 **Sign-In with Ethereum (SIWE)** 模式，是 Web3 DApp 中标准的链下身份验证方案。

1.  **后端逻辑 (Next.js API Routes)**:

    - 需要一个简单的数据库（例如 Supabase, Firebase, or a simple Postgres）来存储用户的链下信息（如昵称）。
    - **`POST /api/auth/login`**:
      - 接收 `message` 和 `signature`。
      - 使用 `ethers.utils.verifyMessage` 来验证签名，恢复出签名者的钱包地址。
      - 如果验证成功，可以生成一个 JWT (JSON Web Token) 返回给前端，用于后续的认证。
    - **`PUT /api/user/profile` (需 JWT 认证)**:
      - 接收 `nickname`。
      - 更新数据库中与该用户钱包地址关联的昵称。
    - **`GET /api/user/courses` (需 JWT 认证)**:
      - 从 JWT 中解析出用户地址。
      - 调用 `CoursePlatform` 合约的 `getEnrolledCourses` (或直接查询 `studentEnrollments`) 来获取该用户购买的课程列表。
      - 返回课程列表给前端。**这样可以避免在前端暴露过多合约逻辑，并且可以增加缓存等优化**。

2.  **前端 (Next.js) - 个人中心页面 (`/profile`)**:
    - **登录/验证**:
      - 当用户访问需要认证的页面时，如果本地没有有效的 JWT，前端会弹窗请求用户签名一条特定的消息（例如 "Sign in to Web3 University"）。
      - 用户使用 MetaMask 签名后，前端将 `message` 和 `signature` 发送到 `/api/auth/login` 获取 JWT 并保存在本地 (e.g., localStorage)。
    - **修改昵称**:
      - 提供一个输入框和 "保存" 按钮。
      - 点击保存时，向后端的 `/api/user/profile` 发送一个携带 JWT 的 `PUT` 请求。
    - **展示已购课程**:
      - 页面加载时，向后端的 `/api/user/courses` 发送一个携带 JWT 的 `GET` 请求，获取并展示课程列表。

## 4. 开发路线图 (Roadmap)

1.  **阶段一：合约开发与部署**

    - [ ] 使用 Hardhat/Foundry 初始化项目。
    - [ ] 编写并测试 `YDToken.sol`。
    - [ ] 编写并测试 `CoursePlatform.sol`。
    - [ ] 编写部署脚本，并将合约部署到测试网 (如 Sepolia)。

2.  **阶段二：核心功能前端实现**

    - [ ] 初始化 Next.js 项目。
    - [ ] 实现钱包连接功能 (Wagmi/Viem)。
    - [ ] 开发课程市场页面，从链上读取并展示课程。
    - [ ] 开发课程创建页面，实现 IPFS 上传和调用 `createCourse`。
    - [ ] 实现课程购买流程 (`approve` + `buyCourse`)。

3.  **阶段三：高级功能与集成**

    - [ ] 开发作者仪表盘，实现 `withdrawFunds` 功能。
    - [ ] 集成 Uniswap 前端，完成 YD -> WETH -> USDT 的兑换流程。
    - [ ] 集成 AAVE 前端，完成 USDT 的 `supply` 流程。

4.  **阶段四：用户中心与优化**
    - [ ] 搭建数据库 (Supabase/Firebase)。
    - [ ] 开发后端 API Routes 用于 SIWE 身份验证。
    - [ ] 开发个人中心前端页面，实现昵称修改和已购课程展示。
    - [ ] 完善 UI/UX 和错误处理。
