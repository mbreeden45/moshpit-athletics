import { ETSY_REVIEWS } from "@/lib/site";

/** "★ 4.9 · 312 reviews on Etsy", linked to the shop. Renders nothing until configured. */
export function EtsyRating({ className = "" }: { className?: string }) {
  const { url, rating, count } = ETSY_REVIEWS;
  if (rating === null || count === null) return null;
  return (
    <a href={url} target="_blank" rel="noopener" className={`label inline-flex gap-1.5 normal-case hover:text-rust ${className}`}>
      <span className="text-paper">★ {rating.toFixed(1)}</span>
      <span>· {count.toLocaleString("en-US")} reviews on Etsy</span>
    </a>
  );
}
