import { TOP_BANNER } from "@/lib/copy";

export function AnnouncementBar() {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="overflow-hidden border-b border-ink bg-signal text-paper" role="region" aria-label="Announcement">
      <p className="sr-only">{TOP_BANNER}</p>
      <div className="flex w-max animate-marquee" aria-hidden="true">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0">
            {items.map((i) => (
              <span key={i} className="eyebrow whitespace-nowrap px-6 py-2 font-semibold">
                {TOP_BANNER}
                <span className="ml-6 opacity-60">✕</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
