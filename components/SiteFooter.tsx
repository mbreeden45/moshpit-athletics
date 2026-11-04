import Link from "next/link";
import { DIALUP_HREF } from "@/lib/dialup";
import { SUPPORT_MAILTO } from "@/lib/site";

/** Desktop: one quiet row under the grid. Phones: a black band of centered links. */
export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto w-full max-md:mt-16 max-md:bg-black max-md:py-10 max-md:text-white md:pt-20">
      <nav
        aria-label="Footer"
        className="mx-auto flex max-w-[1000px] flex-wrap justify-end gap-x-4 gap-y-2 px-4 pb-8 max-md:justify-center max-md:pb-0"
      >
        <a href={SUPPORT_MAILTO} className="link">
          contact
        </a>
        <Link href="/terms" className="link">
          terms
        </Link>
        <Link href="/privacy" className="link">
          privacy
        </Link>
        {/* Easter egg: the whole site, 1999 Angelfire style. Plain link: the era switch runs on a full page load. */}
        <a href={DIALUP_HREF} className="dialup-hide link text-muted" title="1999">
          1999
        </a>
      </nav>
    </footer>
  );
}
