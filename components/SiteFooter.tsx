import Link from "next/link";
import { PRINT_PROFILE } from "@/lib/copy";
import { POPUP_URL, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="display text-4xl">
            Mosh Pit <span className="text-signal">Athletics</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-paper-dim">{PRINT_PROFILE.notice}</p>
        </div>
        <nav aria-label="Footer" className="eyebrow flex flex-col gap-3 text-paper-dim">
          <Link href="/#shop" className="hover:text-paper">
            All products
          </Link>
          <Link href="/#print-profile" className="hover:text-paper">
            Print profile
          </Link>
          <a href={POPUP_URL} className="hover:text-paper">
            Checkout / Order status
          </a>
        </nav>
        <p className="eyebrow text-muted md:text-right">
          © {new Date().getFullYear()} {SITE_NAME}
          <br />
          Printed to order in the USA
        </p>
      </div>
    </footer>
  );
}
