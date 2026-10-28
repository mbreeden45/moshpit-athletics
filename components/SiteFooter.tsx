import Link from "next/link";
import { DIALUP_HREF } from "@/lib/dialup";
import { POPUP_URL, SITE_NAME, SUPPORT_MAILTO } from "@/lib/site";

const LINKS = [
  { label: "Terms", href: `${POPUP_URL}/terms-and-conditions` },
  { label: "Privacy", href: `${POPUP_URL}/privacy-policy` },
  { label: "Contact", href: SUPPORT_MAILTO },
];

export function SiteFooter() {
  return (
    <footer className="site-footer flex flex-wrap items-end justify-between gap-8 border-t border-line px-4 py-12 uppercase sm:px-8">
      <p className="headline-xl text-[clamp(48px,8vw,120px)] leading-[0.85]">{SITE_NAME}</p>
      <nav aria-label="Footer" className="flex flex-wrap gap-6 text-muted">
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} className="hover:text-rust">
            {l.label}
          </a>
        ))}
        <Link href="/#collection" className="border-b border-paper text-paper hover:border-rust hover:text-rust">
          The Archive
        </Link>
      </nav>
      {/* Easter egg: the whole site, 1999 Angelfire style. */}
      <a href={DIALUP_HREF} className="dialup-hide w-full text-[10px] normal-case tracking-normal text-placeholder hover:text-rust">
        Best viewed in Netscape Navigator 4.0 · Dial-Up Edition
      </a>
    </footer>
  );
}
