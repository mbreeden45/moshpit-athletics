import Link from "next/link";
import { DIALUP_HREF } from "@/lib/dialup";
import { POPUP_URL, SUPPORT_MAILTO } from "@/lib/site";

const LINKS = [
  { label: "contact", href: SUPPORT_MAILTO },
  { label: "terms", href: `${POPUP_URL}/terms-and-conditions` },
  { label: "privacy", href: `${POPUP_URL}/privacy-policy` },
  { label: "archive", href: `${POPUP_URL}/products` },
];

export function SiteFooter() {
  return (
    <footer className="site-footer mx-auto mt-auto flex w-full max-w-[1000px] flex-wrap justify-between gap-x-4 gap-y-2 px-4 pb-8 pt-20">
      <Link href="/" className="link">
        shop all
      </Link>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
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
    </footer>
  );
}
