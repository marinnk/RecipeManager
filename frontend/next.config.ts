import type { NextConfig } from "next";

// ローカル開発では frontend・backend が同じホスト上で動くため localhost:8080 でよいが、
// Docker Compose ではコンテナごとにホストが分かれるため、backend コンテナのサービス名を
// BACKEND_INTERNAL_URL で上書きできるようにする（docker-compose.yml 参照）
const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // Docker用に、実行に必要なファイルだけを .next/standalone にまとめる
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
