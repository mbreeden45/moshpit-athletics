import Link from "next/link";
import { POPUP_URL } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="display text-2xl leading-none sm:text-3xl" aria-label="Mosh Pit Athletics home">
          Mosh Pit <span className="text-signal">Athletics</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 eyebrow">
          <Link href="/#shop" className="hover:text-signal">
            Shop
          </Link>
          <Link href="/#print-profile" className="hidden hover:text-signal sm:inline">
            Print
          </Link>
          <a
            href={POPUP_URL}
            className="border border-paper px-3 py-1.5 transition-colors hover:border-signal hover:bg-signal"
          >
            Cart
          </a>
        </nav>
      </div>
    </header>
  );
}
