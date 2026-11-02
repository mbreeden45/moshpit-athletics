import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pages from the old WooCommerce store that search engines still know.
  // (Old /product/<slug>/ pages are handled by app/product/[...path]/route.ts.)
  async redirects() {
    return ["/shop", "/shop/:path*", "/product-category/:path*", "/cart", "/checkout", "/my-account", "/my-account/:path*"].map(
      (source) => ({ source, destination: "/", permanent: true }),
    );
  },
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
