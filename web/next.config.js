import path from 'path'
import { fileURLToPath } from 'url'

const turbopackRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build',
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: turbopackRoot,
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
