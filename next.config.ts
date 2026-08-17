import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
    // Note: This is only an example. If you use Pages Router,
    // use something else that works, such as "service-worker/index.ts".
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    // 在非生产环境中禁用 Serwist，避免与 Turbopack 冲突
    disable: process.env.NODE_ENV !== "production",
});

const baseConfig: NextConfig = {
    reactStrictMode: true,
    // Cache Components：静态外壳（骨架/侧边栏）构建期预渲染走 CDN，
    // Suspense 内的数据在请求时流式下发。同时启用 PPR 与 `use cache`。
    cacheComponents: true,
    // 添加空的 turbopack 配置以消除警告
    turbopack: {},
    logging: {
        fetches: {
            fullUrl: true,
            hmrRefreshes: true,
        },
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '20mb',
        }
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https' as const,
                hostname: 'gallery233.pages.dev',
                port: '',
                pathname: '/**',
            },
        ],
    },
    rewrites: async () => {
        return [
            {
                source: '/upload',
                destination: 'https://gallery233.pages.dev/upload',
            },
        ];
    },
};

// 只在生产环境中启用 Serwist
const nextConfig = withSerwist(baseConfig)

export default nextConfig;
