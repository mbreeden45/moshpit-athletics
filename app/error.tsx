"use client";

import { POPUP_URL } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex max-w-[1000px] flex-col items-center gap-3 px-4 py-20 text-center">
      <h1 className="font-bold">we couldn&rsquo;t load products right now.</h1>
      <p>the full store is still open on our pop-up.</p>
      <div className="flex gap-4">
        <button type="button" onClick={reset} className="cursor-pointer underline underline-offset-2">
          try again
        </button>
        <a href={POPUP_URL} className="underline underline-offset-2">
          open pop-up store
        </a>
      </div>
    </section>
  );
}
