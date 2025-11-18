import createMDX from "@next/mdx";

/** Enable MDX (.mdx, .md) */
const withMDX = createMDX({
  extension: /\.mdx?$/
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],

  // IMPORTANT for Vercel
  output: "standalone",

  // Disable image optimization (not needed for docs)
  images: {
    unoptimized: true
  },

  experimental: {
    mdxRs: true,
    serverActions: {
      allowedOrigins: ["*"]
    }
  }
});

export default nextConfig;
