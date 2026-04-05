import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    // Enable WebAssembly support (required for @mediapipe/tasks-genai)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Exclude mediapipe from server-side bundle (WASM only runs client-side)
    if (isServer) {
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('@mediapipe/tasks-genai')
      }
    }

    // Serve .wasm files as static assets with correct MIME type
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    return config
  },
  async headers() {
    return [
      {
        // Apply COOP/COEP to all routes — required for SharedArrayBuffer (WASM)
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
