/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'react',
      'react-dom'
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' }
    ]
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  typescript: {
    ignoreBuildErrors: false
  }
};

module.exports = nextConfig;


