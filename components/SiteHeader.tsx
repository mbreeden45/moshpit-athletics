import Link from "next/link";
import { POPUP_URL, SITE_NAME } from "@/lib/site";
import { BagButton } from "./CartProvider";

const NAV = [
  { label: "Catalog", href: "/#collection" },
  { label: "New Drops", href: "/#featured" },
  { label: "Blueprint", href: "/#blueprint" },
  { label: "Archive", href: `${POPUP_URL}/products` },
];

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-ink/95 px-4 py-4 backdrop-blur-[6px] sm:px-8">
      <Link
        href="/"
        className="font-display text-[20px] font-extrabold uppercase tracking-[-0.01em] [font-stretch:75%] hover:text-rust"
      >
        {SITE_NAME}
      </Link>
      <nav aria-label="Primary" className="order-3 flex w-full flex-wrap gap-x-6 gap-y-2 sm:gap-x-8 uppercase md:order-none md:w-auto">
        {NAV.map((item) => (
          <Link key={item.label} href={item.href} className="hover:text-rust">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex gap-5 uppercase">
        <span className="text-muted">USD</span>
        <BagButton />
      </div>
    </header>
  );
}
