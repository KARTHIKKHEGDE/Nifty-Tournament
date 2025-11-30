/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    transpilePackages: ['klinecharts', 'konva', 'react-konva'],
    images: {
        domains: ['localhost'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    },
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            fs: false,
            net: false,
            tls: false,
            canvas: false,
        };

        // Ignore canvas module for client-side builds
        if (!isServer) {
            config.externals = config.externals || {};
            config.externals.canvas = 'canvas';
        }

        return config;
    },
}

module.exports = nextConfig
