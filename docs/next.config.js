// next.config.js
const createMDX = require('@next/mdx');
const remarkGfm = require('remark-gfm');

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  output: 'standalone',
  images: {
    unoptimized: true
  },
  experimental: {
    mdxRs: false
  }
});

module.exports = nextConfig;
