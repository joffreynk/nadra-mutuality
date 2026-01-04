/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'react',
      'react-dom',
      '@prisma/client'
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Optimize fonts
  optimizeFonts: true,
};

module.exports = nextConfig;
