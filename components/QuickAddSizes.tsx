"use client";

import type { CartItem } from "@/lib/cart";
import { useCart } from "./CartProvider";

/** Hover size pills on a catalog card: one tap adds that size to the bag. */
export function QuickAddSizes({ items }: { items: (CartItem & { size: string })[] }) {
  const { add } = useCart();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex justify-end gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
      {items.map(({ size, ...item }) => (
        <button
          key={item.variantId}
          type="button"
          aria-label={`Add ${item.name}, ${item.detail} to bag`}
          onClick={() => add(item)}
          className="cursor-pointer border border-paper bg-ink px-[9px] py-1.5 text-[11px] text-paper hover:bg-paper hover:text-ink"
        >
          {size}
        </button>
      ))}
    </div>
  );
}
