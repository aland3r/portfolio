/** @type {import('next').NextConfig} */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const authDir = path.resolve(rootDir, 'lib/gestalt-auth')

const nextConfig = {
  output: 'export',
  devIndicators: false,
  allowedDevOrigins: ['100.101.66.105'],
  turbopack: {
    resolveAlias: {
      '@gestalt/auth': './lib/gestalt-auth',
    },
  },
  webpack: (config) => {
    config.resolve.alias['@gestalt/auth'] = authDir
    return config
  },
};

export default nextConfig;
