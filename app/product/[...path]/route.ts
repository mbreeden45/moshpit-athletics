import { NextResponse, type NextRequest } from "next/server";
import { getDesigns } from "@/lib/catalog";

/**
 * Old WooCommerce product URLs (/product/<slug>/) that Google still has
 * indexed. Each maps to the Printify product (in the current shop) carrying
 * the same artwork, and redirects permanently to that design's page, so the
 * old links keep working and their search ranking moves to the new pages.
 * Anything unknown goes to the catalog.
 */
const LEGACY_PRODUCTS: Record<string, string> = {
  "my-chemical-romance-atlanta-braves-themed-baseball-hat-a-frame": "68ed6fc2ed926f86860dfb28",
  "my-chemical-romance-atlanta-braves-scythe-tee-shaky-knees-festival-at-piedmont-park-2025-replica-comfort-colors-1717-t-shirt":
    "68ed6fc2ed926f86860dfb28",
  "black-heaven-on-earth-t-shirt-my-chemical-romance-concert-tee-dodger-stadium-comfort-colors-1717-black-parade-inspired-shirt":
    "68ed6fc4ed926f86860dfb29",
  "dojasu-heavy-cotton-tee": "68f068010f158415e405017c",
  "three-panel-fleece-hoodie": "68ed6fceed926f86860dfb34",
  "unisex-garment-dyed-t-shirt": "68ed6fcded926f86860dfb32",
  "turnoverstile-peripheral-glow-on": "68ed6fcaed926f86860dfb2f",
  "cooper-flagg-x-black-flag-bootleg": "68ed6fc6ed926f86860dfb2d",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const productId = LEGACY_PRODUCTS[path[0]?.toLowerCase() ?? ""];
  const designs = productId ? await getDesigns() : [];
  const design = designs.find((d) => d.products.some((p) => p.id === productId));
  const destination = design ? `/products/${design.slug}` : "/#collection";
  return NextResponse.redirect(new URL(destination, req.nextUrl.origin), 308);
}
