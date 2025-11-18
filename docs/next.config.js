import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // required untuk deployment Vercel
  output: 'standalone',

  images: {
    unoptimized: true
  },

  // NON-AKTIFKAN MDX-RS (ini penyebab Next pakai import-source-file)
  experimental: {
    mdxRs: false
  }
});

export default nextConfig;
