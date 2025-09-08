## 基本验证流程

1. **前端钱包连接**：用户连接钱包获得地址
2. **消息签名**：前端调用钱包签名一条特定消息
3. **发送验证**：将地址、消息、签名一起发送给后端
4. **后端验证**：后端验证签名确实来自该地址
5. **授权访问**：验证通过后允许查询链上信息

# 核心代码

## 前端

```typescript
// 连接钱包并获取签名
async function authenticateWallet() {
  if (!window.ethereum) return;

  const provider = new ethers.BrowserProvider(
    window.ethereum
  );
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // 创建要签名的消息（通常包含时间戳防重放）
  const timestamp = Date.now();
  const message = `验证钱包地址: ${address}\n时间戳: ${timestamp}`;

  try {
    const signature = await signer.signMessage(message);

    // 发送到后端验证
    const response = await fetch("/api/verify-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        message,
        signature,
        timestamp,
      }),
    });

    const result = await response.json();
    if (result.verified) {
      // 验证成功，可以进行后续操作
      console.log("钱包验证成功");
    }
  } catch (error) {
    console.error("签名失败:", error);
  }
}
```

## 后端

```typescript
const { ethers } = require("ethers");

app.post("/api/verify-wallet", (req, res) => {
  const { address, message, signature, timestamp } =
    req.body;

  try {
    // 验证时间戳（防止重放攻击）可选
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      // 5分钟有效期 可选
      return res.json({
        verified: false,
        error: "签名已过期",
      });
    }

    // 验证签名 必要
    const recoveredAddress = ethers.verifyMessage(
      message,
      signature
    );

    if (
      recoveredAddress.toLowerCase() ===
      address.toLowerCase()
    ) {
      // 验证成功，可以生成JWT token或session, 可选
      const token = generateJWT(address);
      res.json({
        verified: true,
        token,
        address: recoveredAddress,
      });
    } else {
      res.json({ verified: false, error: "签名验证失败" });
    }
  } catch (error) {
    res.json({ verified: false, error: "验证过程出错" });
  }
});
```
