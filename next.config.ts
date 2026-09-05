import type { NextConfig } from 'next';

// GitHub project sites mount the game at /game12/. Keep the normal root build
// available for local previews and hosts that serve the game at their origin.
const basePath = process.env.LUMA_BASE_PATH ?? '';
if (basePath && !/^\/[a-zA-Z0-9_-]+$/.test(basePath)) {
  throw new Error('LUMA_BASE_PATH must be empty or one path such as /game12.');
}
const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
};

export default nextConfig;
