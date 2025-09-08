This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

在.env.local 添加环境变量
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wallet_connect_project_id_here
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_api_key_here

为了让课程列表正确显示，您需要做两件事：
部署合约并获取地址：
在项目根目录打开终端，启动一个本地节点：npx hardhat node
打开另一个终端，同样在项目根目录，将合约部署到这个本地节点：npx hardhat ignition deploy ignition/modules/Deploy.js --network localhost
部署成功后，终端会打印出 CoursePlatform 和 YDToken 的地址。
更新配置文件：
复制上一步中得到的两个地址。
打开 next-app/src/lib/contracts.ts 文件。
将占位的 '0x...' 替换成您刚刚复制的真实合约地址。

openssl rand -base64 32 生成一个秘钥，然后放到.env.local
