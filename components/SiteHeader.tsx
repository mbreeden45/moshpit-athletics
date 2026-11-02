import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { BagButton } from "./CartProvider";

export function SiteHeader() {
  return (
    <header className="site-header relative flex justify-center px-4 pb-10 pt-11 sm:pb-16 sm:pt-6">
      <Link
        href="/"
        className="font-display text-[26px] font-black uppercase leading-none tracking-[-0.01em] [font-stretch:62%] [word-spacing:0.08em] sm:text-[32px]"
      >
        {SITE_NAME}
      </Link>
      <div className="absolute right-4 top-4">
        <BagButton />
      </div>
    </header>
  );
}
