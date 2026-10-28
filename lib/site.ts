/** Public, client-safe configuration. */

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const SITE_NAME = "Mosh Pit Athletics";

/** Production domain — canonical tags, OG URLs, JSON-LD ids, sitemap and robots all derive from this. */
export const SITE_URL = trimSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "https://moshpitathletics.com",
);

export const POPUP_URL = trimSlash(
  process.env.NEXT_PUBLIC_POPUP_URL || "https://mosh-pit-athletics.printify.me",
);

export const SUPPORT_EMAIL = "support@moshpitathletics.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Order Inquiry")}`;

export const SITE_DESCRIPTION =
  "Heavyweight cotton, boxy silhouettes, and screen-print culture. Small-batch graphic tees printed to order in the USA.";
