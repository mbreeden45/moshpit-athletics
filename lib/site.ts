/** Public, client-safe configuration. */

/**
 * Accepts dashboard-style values ("moshpitathletics.com", quoted, padded)
 * and returns an absolute https URL without a trailing slash. Falls back
 * to `fallback` if the value still isn't a valid URL, so a typo in an
 * environment variable can't break the build.
 */
function normalizeUrl(raw: string | undefined, fallback: string): string {
  let value = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  if (!value) return fallback;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    console.warn(`[site] Ignoring invalid URL ${JSON.stringify(raw)}; using ${fallback}`);
    return fallback;
  }
}

export const SITE_NAME = "Mosh Pit Athletics";

/** Production domain — canonical tags, OG URLs, JSON-LD ids, sitemap and robots all derive from this. */
export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://www.moshpitathletics.com",
);

export const POPUP_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_POPUP_URL,
  "https://mosh-pit-athletics.printify.me",
);

export const SUPPORT_EMAIL = "support@moshpitathletics.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Order Inquiry")}`;

export const SITE_DESCRIPTION =
  "Heavyweight cotton, boxy silhouettes, and graphics printed straight into the fabric. Graphic tees made to order in the USA.";

/**
 * Etsy shop rating, shown as a linked badge (never as structured data: Google
 * doesn't allow marking up reviews collected on another site). The badge stays
 * hidden until both numbers are filled in; keep them current with the shop.
 */
export const ETSY_REVIEWS: { url: string; rating: number | null; count: number | null } = {
  url: "https://www.etsy.com/shop/MoshPitAthletics#reviews",
  rating: 5.0,
  count: 23,
};
