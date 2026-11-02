import { ETSY_REVIEWS } from "@/lib/site";

/** "★ 5.0 · 23 reviews on Etsy", linked to the shop. Renders nothing until configured. */
export function EtsyRating({ className = "" }: { className?: string }) {
  const { url, rating, count } = ETSY_REVIEWS;
  if (rating === null || count === null) return null;
  return (
    <a href={url} target="_blank" rel="noopener" className={`link text-muted ${className}`}>
      ★ {rating.toFixed(1)} · {count.toLocaleString("en-US")} reviews on etsy
    </a>
  );
}
