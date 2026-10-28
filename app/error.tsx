"use client";

import { POPUP_URL } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6">
      <p className="eyebrow text-signal">Catalog offline</p>
      <h1 className="display mt-4 text-6xl">Feedback on the line</h1>
      <p className="mt-6 text-paper-dim">We couldn&rsquo;t load products right now. The full store is still open on our Pop-Up.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="eyebrow border border-paper px-6 py-3 hover:bg-paper hover:text-ink">
          Try again
        </button>
        <a href={POPUP_URL} className="eyebrow bg-signal px-6 py-3 hover:bg-paper hover:text-ink">
          Open Pop-Up store
        </a>
      </div>
    </section>
  );
}
