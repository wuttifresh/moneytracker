/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    // Convert barrel imports (lucide-react, recharts) into direct imports so
    // dev compilation and production bundles only include what's used.
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
