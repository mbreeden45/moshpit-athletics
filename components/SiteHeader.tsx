import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { BackButton } from "./BackButton";
import { BagButton } from "./CartProvider";

/**
 * Phones: a grey bar with back arrow, wordmark on the left and the bag on
 * the right. Desktop: the wordmark centered on white, bag in the corner.
 */
export function SiteHeader() {
  return (
    <header className="site-header relative flex h-12 items-center gap-3 bg-[#f0f0f0] px-4 md:mb-16 md:h-auto md:justify-center md:bg-transparent md:pt-6">
      <div className="flex h-full items-center md:hidden">
        <BackButton />
      </div>
      <Link
        href="/"
        className="font-display text-[22px] font-black uppercase leading-none tracking-[-0.01em] [font-stretch:62%] [word-spacing:0.08em] md:text-[32px]"
      >
        {SITE_NAME}
      </Link>
      <div className="ml-auto md:absolute md:right-4 md:top-4">
        <BagButton />
      </div>
    </header>
  );
}
