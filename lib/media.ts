import { SITE_URL } from "./site";

/**
 * Printify's image hosts disallow crawling in robots.txt (everything outside
 * /api/catalog/ and /api/file/), so Google can't fetch product photos from
 * them: Merchant Center rejects every item and rich results lose their
 * images. Images handed to Google (feed, structured data, Open Graph,
 * sitemap) go through /media on this site instead, which proxies and caches
 * them (app/media/[host]/[...path]/route.ts).
 */
export const MEDIA_HOSTS: Record<string, string> = {
  p: "images-api.printify.com",
  pi: "images.printify.com",
  cf: "d123s6f1z9g2wk.cloudfront.net",
};

const KEY_BY_HOST = Object.fromEntries(Object.entries(MEDIA_HOSTS).map(([k, h]) => [h, k]));

/** https://images-api.printify.com/mockup/x/y.jpg?camera_label=front → https://www…/media/p/mockup/x/y.jpg?camera_label=front */
export function publicImageUrl(src: string): string {
  try {
    const url = new URL(src);
    const key = KEY_BY_HOST[url.hostname];
    return key ? `${SITE_URL}/media/${key}${url.pathname}${url.search}` : src;
  } catch {
    return src;
  }
}
