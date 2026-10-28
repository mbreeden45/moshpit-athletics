/** Public, client-safe configuration. */

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const SITE_NAME = "Mosh Pit Athletics";

export const SITE_URL = trimSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "https://moshpitathletics.com",
);

export const POPUP_URL = trimSlash(
  process.env.NEXT_PUBLIC_POPUP_URL || "https://mosh-pit-athletics.printify.me",
);

export const SITE_DESCRIPTION =
  "Small-batch show shirts printed in the USA on Comfort Colors and Shaka Wear blanks with water-based pigment inks.";
