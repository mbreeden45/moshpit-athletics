"use client";

import { useRouter } from "next/navigation";

type Option = { slug: string; label: string; href: string };

/** Phone category picker: a full-width bar showing the current category, with the native menu on tap. */
export function CategorySelect({ options, active }: { options: Option[]; active: string }) {
  const router = useRouter();
  const current = options.find((o) => o.slug === active) ?? options[0];
  return (
    <label className="relative flex h-[46px] items-center justify-between border-b border-faint px-[18px] text-[13px] font-bold">
      <span>{current.label}</span>
      <svg aria-hidden="true" viewBox="0 0 8 5" className="h-[5px] w-2">
        <path d="M0 0h8L4 5z" />
      </svg>
      <span className="sr-only">Category</span>
      <select
        value={current.slug}
        onChange={(e) => {
          const next = options.find((o) => o.slug === e.target.value);
          if (next) router.push(next.href);
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
