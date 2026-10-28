import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images-api.printify.com" },
      { protocol: "https", hostname: "images.printify.com" },
      // Custom uploads attached to products (e.g. lifestyle shots) are served from Printify's CloudFront.
      { protocol: "https", hostname: "d123s6f1z9g2wk.cloudfront.net" },
    ],
  },
};

export default nextConfig;
