import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

/** @type {import('@next/mdx').WithMDX} */
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure page extensions to include md and mdx
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // Output to 'standalone' mode for Vercel deployment
  output: 'standalone',
  
  // Set the base path if you are deploying to a subdirectory
  // basePath: '/docs',

  // React Strict Mode is good practice
  reactStrictMode: true,

  // Experimental features - keep mdxRs false for compatibility with some remark/rehype plugins
  experimental: {
    mdxRs: false,
  },
};

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
