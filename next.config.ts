import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      {
        protocol: 'https',
        hostname:  '*.supabase.co',
        pathname:  '/storage/v1/object/public/**',
      },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), 'hls.js']
    }
    return config
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb',
    },
  },
}

export default nextConfig
