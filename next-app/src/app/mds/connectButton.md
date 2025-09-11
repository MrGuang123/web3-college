关键 API 和 Hooks 详解

1. wagmi Hooks (处理钱包连接)

- useAccount():
  这是 wagmi 提供的一个 hook，用于获取当前连接钱包的账户信息。
  address: 当前连接的钱包地址 (例如 0x...)。
  isConnected: 一个布尔值，true 表示钱包已连接，false 表示未连接。
  chainId: 当前连接的链 ID (例如 1 代表以太坊主网, 11155111 代表 Sepolia 测试网)。
- useDisconnect():
  提供一个 disconnect 函数，调用它会断开当前钱包的连接。
- useSignMessage():
  提供 signMessageAsync 函数。这是实现“通过以太坊登录 (Sign-In with Ethereum, SIWE)” 的核心。调用它会请求用户的钱包对一条特定的消息进行签名。这个签名就像是用户的数字密码，可以证明消息确实来自于持有该钱包私钥的人，且无法被伪造。

2. next-auth/react Hooks (处理应用会话)
   useSession():
   这是 NextAuth.js 在客户端的核心 hook。
   data: session: 如果用户已经登录，这里会包含用户的会话信息，比如 session.user.name (在这里其实是用户的地址), session.user.image 等。如果未登录，则为 null。
   status: 一个表示当前认证状态的字符串，可以是：
   "loading": 正在检查会话状态。
   "authenticated": 用户已登录。
   "unauthenticated": 用户未登录。
   signIn():
   一个函数，用于触发登录流程。在我们的代码中，它调用的是我们在后端 API ([...nextauth]/route.ts) 中定义的 credentials 提供者。我们会把钱包签名后的消息和签名本身作为“凭证”传给它。
   signOut():
   一个函数，用于清除 NextAuth.js 的会话 cookie，实现退出登录。
3. siwe 库
   SiweMessage:
   这是一个辅助库，用于创建和解析符合 EIP-4361 (Sign-In with Ethereum) 标准的签名消息。
   直接手动拼接签名字符串容易出错且不安全。使用这个库可以确保我们生成的消息格式是标准化的、安全的，能够被钱包和后端正确识别。它包含了防止重放攻击的 nonce（由 NextAuth 自动处理）、域名绑定等安全特性。
   核心业务流程详解
   handleSignIn (登录流程)
   这是整个组件最复杂的部分，它将 Web3 的“钱包签名”和 Web2 的“会话登录”连接了起来：
   setIsSigning(true): 设置一个状态锁，防止用户在签名过程中重复点击，并更新按钮文本为 "Signing in..."。
   new SiweMessage(...): 创建一个标准化的签名请求消息。
   domain, uri, address, chainId: 这些信息确保了签名是为你这个特定的网站、特定的用户、在特定的链上生成的，无法被用在其他地方。
   statement: 这是将要显示在用户钱包签名提示框中的人类可读的文本，告诉用户他们正在做什么。
   signMessageAsync({ message: ... }):
   关键一步。这会弹出用户的 MetaMask (或其他钱包) 窗口，显示上面创建的消息，并要求用户点击“签名”。
   用户签名后，这个函数会返回一个独一无二的 signature (签名字符串)。
   signIn("credentials", { ... }):
   承上启下的一步。它将原始消息 message 和用户的 signature 一起发送到我们的 Next.js 后端 API (/api/auth/signin)。
   后端会使用 siwe 库来验证这个 signature 是否确实是由 message 中的 address 对 message 本身签名的。
   如果验证通过，NextAuth.js 就会为该用户创建一个会话，并在用户的浏览器中设置一个安全的 HTTP-only cookie。
   finally { setIsSigning(false) }: 无论成功还是失败，都解除状态锁。
   handleSignOut (登出流程)
   signOut(): 调用 NextAuth 的函数，通知后端使会话失效并删除 cookie。
   disconnect(): 重要补充。同时调用 wagmi 的函数，断开钱包与 dApp 的连接。这提供了更好的用户体验，确保了“应用登出”和“钱包断开”两个操作同步进行。
