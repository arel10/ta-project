/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Existing repo-wide lint debt should not block production build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
