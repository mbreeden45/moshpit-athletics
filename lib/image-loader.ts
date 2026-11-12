/**
 * next/image loader. Printify's image API resizes on its own (`s=<px>`), so
 * product photos never go through Vercel Image Optimization, whose free tier
 * is only 5,000 transformations a month. Other hosts are served as-is.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith("https://images-api.printify.com/")) {
    const url = new URL(src);
    url.searchParams.set("s", String(width));
    return url.toString();
  }
  return src;
}
