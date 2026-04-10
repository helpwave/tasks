import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      new URL('https://cdn.helpwave.de/**'),
      new URL('https://helpwave.de/**'),
    ],
  },
}

export default nextConfig
