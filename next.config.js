/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize font loading
  optimizeFonts: true,
  // Ensure experimental.optimizeCss is false as it can cause issues with preloaded fonts
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig
