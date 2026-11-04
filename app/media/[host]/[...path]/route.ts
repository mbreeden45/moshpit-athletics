import type { NextRequest } from "next/server";
import { MEDIA_HOSTS } from "@/lib/media";

/**
 * GET /media/<host>/<path>: product photos from Printify's image hosts,
 * served from this domain so search engines may crawl them (see lib/media.ts).
 * Responses are cached at the edge for a week; mockup URLs are stable.
 */

// Printify can take a while to render a mockup the first time.
export const maxDuration = 60;

export async function GET(req: NextRequest, { params }: { params: Promise<{ host: string; path: string[] }> }) {
  const { host, path } = await params;
  const upstreamHost = MEDIA_HOSTS[host];
  if (!upstreamHost || path.some((part) => part === ".." || part === "")) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(
    `https://${upstreamHost}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
    { cache: "no-store" },
  ).catch(() => null);
  const type = upstream?.headers.get("content-type") ?? "";
  if (!upstream?.ok || !type.startsWith("image/")) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
