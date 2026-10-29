import Image from "next/image";
import Link from "next/link";
import { getDesigns } from "@/lib/catalog";
import { BANNER_PHOTO, EXIT_HREF, HIT_COUNT } from "@/lib/dialup";
import { SITE_NAME } from "@/lib/site";
import { BagButton } from "../CartProvider";

/*
 * Dial-Up Edition chrome. Server-rendered on every page but hidden by CSS
 * (.dialup-only) unless <html data-era="dialup">, so the normal site never
 * hydrates differently and the switch costs no layout shift.
 */

const NAV = [
  { label: "Home", href: "/" },
  { label: "Catalog", href: "/#collection" },
  { label: "Latest", href: "/#featured" },
  { label: "Blueprint", href: "/#blueprint" },
];

export async function DialUpBanner() {
  const designs = await getDesigns().catch(() => []);
  const photo = BANNER_PHOTO ?? designs[0]?.products[0].defaultImage ?? null;
  const strip = designs
    .slice(1, 4)
    .map((d) => d.products[0].defaultImage)
    .filter((src): src is string => Boolean(src));

  return (
    <header className="dialup-only dialup-banner">
      <div className="dialup-photo">
        {photo && <Image src={photo} alt="" fill sizes="140px" className="object-cover" />}
      </div>
      <div className="dialup-banner-main">
        <div className="dialup-strip" aria-hidden="true">
          {strip.map((src) => (
            <span key={src} className="dialup-strip-cell">
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </span>
          ))}
        </div>
        <Link href="/" className="dialup-wordart">
          {SITE_NAME}
        </Link>
        <p className="dialup-tagline">~*~ official homepage ~*~</p>
        <div className="dialup-flames" aria-hidden="true" />
      </div>
    </header>
  );
}

export function DialUpSidebar() {
  return (
    <aside className="dialup-only dialup-sidebar" aria-label="Dial-Up Edition navigation">
      <nav className="dialup-pills">
        {NAV.map((item) => (
          <Link key={item.label} href={item.href} className="dialup-pill">
            {item.label}
          </Link>
        ))}
        <span className="dialup-pill dialup-pill-bag">
          <BagButton />
        </span>
      </nav>

      <div className="dialup-box">
        <p className="dialup-small">You are visitor #</p>
        <p className="dialup-counter" aria-label={`Visitor number ${Number(HIT_COUNT)}`}>
          {HIT_COUNT.split("").map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </p>
      </div>

      <div className="dialup-construction" role="img" aria-label="Under construction">
        <span>UNDER</span>
        <span>CONSTRUCTION</span>
      </div>

      <div className="dialup-box dialup-small">
        Best viewed at 800x600 in Netscape Navigator 4.0
      </div>
      <div className="dialup-box dialup-small">
        <span className="dialup-blink">★</span> Made with Notepad <span className="dialup-blink">★</span>
      </div>

      {/* Plain link: the era switch runs on a full page load. */}
      <a href={EXIT_HREF} className="dialup-exit">
        &laquo; Back to 2026
      </a>
    </aside>
  );
}

export async function DialUpMarquee() {
  const designs = await getDesigns().catch(() => []);
  const newest = designs.slice(0, 3).map((d) => d.name);
  const text = [
    "WELCOME 2 MY HOMEPAGE",
    ...newest.map((n) => `NEW!!! ${n}`),
    "PRINTED TO ORDER IN THE USA",
    "SIGN UP FOR NOTHING",
    "ALL SALES FINAL",
  ].join("  ★  ");

  return (
    <div className="dialup-only dialup-marquee" aria-hidden="true">
      <div className="dialup-marquee-track">
        <span>{text}  ★  </span>
        <span>{text}  ★  </span>
      </div>
    </div>
  );
}
