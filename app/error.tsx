"use client";

import { SUPPORT_MAILTO } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex max-w-[1000px] flex-col items-center gap-3 px-4 py-20 text-center">
      <h1 className="font-bold">we couldn&rsquo;t load products right now.</h1>
      <p>give it a minute and try again, or email us and we&rsquo;ll help with your order.</p>
      <div className="flex gap-4">
        <button type="button" onClick={reset} className="cursor-pointer underline underline-offset-2">
          try again
        </button>
        <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
          email us
        </a>
      </div>
    </section>
  );
}
