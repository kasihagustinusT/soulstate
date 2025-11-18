import createMDX from "@next/mdx";

/** Enable MDX */
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  // Required for Vercel
  output: "standalone",

  images: {
    unoptimized: true,
  },

  experimental: {
    mdxRs: true,
  }
};

export default withMDX(nextConfig);
