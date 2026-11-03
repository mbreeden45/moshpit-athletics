import Link from "next/link";
import { DIALUP_HREF } from "@/lib/dialup";
import { POPUP_URL, SUPPORT_MAILTO } from "@/lib/site";

const LINKS = [
  { label: "contact", href: SUPPORT_MAILTO },
  { label: "terms", href: `${POPUP_URL}/terms-and-conditions` },
  { label: "privacy", href: `${POPUP_URL}/privacy-policy` },
  { label: "archive", href: `${POPUP_URL}/products` },
];

/** Desktop: one quiet row under the grid. Phones: a black band of centered links. */
export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto w-full max-md:mt-16 max-md:bg-black max-md:py-10 max-md:text-white md:pt-20">
      <div className="mx-auto flex max-w-[1000px] flex-wrap justify-between gap-x-4 gap-y-4 px-4 pb-8 max-md:flex-col max-md:items-center max-md:pb-0">
        <Link href="/" className="link">
          shop all
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="link">
              {l.label}
            </a>
          ))}
          {/* Easter egg: the whole site, 1999 Angelfire style. */}
          <a href={DIALUP_HREF} className="dialup-hide link text-muted" title="Dial-Up Edition">
            1999
          </a>
        </nav>
      </div>
    </footer>
  );
}
