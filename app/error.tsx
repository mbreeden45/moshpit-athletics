"use client";

import { POPUP_URL } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="px-4 pb-24 pt-24 sm:px-8">
      <p className="mb-8 uppercase text-rust">Catalog offline</p>
      <h1 className="headline-xl text-[clamp(56px,11vw,180px)]">
        Feedback
        <br />
        <span className="text-muted">on the line.</span>
      </h1>
      <p className="prose-body mt-10 max-w-[460px]">
        We couldn&rsquo;t load products right now. The full store is still open on our Pop-Up.
      </p>
      <div className="mt-10 flex flex-wrap gap-3 uppercase">
        <button type="button" onClick={reset} className="cursor-pointer border border-paper px-9 py-5 hover:bg-paper hover:text-ink">
          Try again
        </button>
        <a href={POPUP_URL} className="border border-paper bg-paper px-9 py-5 font-medium text-ink hover:border-rust hover:bg-rust hover:text-paper">
          Open Pop-Up store
        </a>
      </div>
    </section>
  );
}
