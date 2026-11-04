"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Phone header "‹": back one page on this site, else to the shop. Hidden on the shop home. */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  // The header persists across client navigations, so this counts in-site page changes.
  const inSiteNavs = useRef(-1);
  useEffect(() => {
    inSiteNavs.current += 1;
  }, [pathname]);

  if (pathname === "/") return null;
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => {
        const fromSite = inSiteNavs.current > 0 || document.referrer.startsWith(window.location.origin);
        if (fromSite && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="-ml-1 flex h-full cursor-pointer items-center px-1"
    >
      <svg aria-hidden="true" viewBox="0 0 7 12" className="h-3 w-[7px] fill-none stroke-current stroke-[1.5]">
        <path d="M6 1 1 6l5 5" />
      </svg>
    </button>
  );
}
