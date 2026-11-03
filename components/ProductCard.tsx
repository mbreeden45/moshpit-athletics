import Image from "next/image";
import Link from "next/link";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice } from "@/lib/product";

type Props = {
  design: StorefrontDesign;
  priority?: boolean;
  /** Recently added: a small "new" tag on phones. */
  isNew?: boolean;
  /** NEW! sticker in the Dial-Up Edition. */
  dialupNew?: boolean;
};

/**
 * A catalog tile. Desktop shows only the photo; phones get a bordered cell
 * with the name and price (or "sold out") under it.
 */
export function ProductCard({ design, priority, isNew, dialupNew }: Props) {
  const product = design.products[0];
  const soldOut = !design.products.some((p) => p.variants.some((v) => v.available));

  return (
    <li className="mpa-card relative max-md:border-b max-md:border-r max-md:border-faint max-md:p-2">
      <Link href={`/products/${design.slug}`} title={design.name} className="group block">
        <span className="relative block aspect-square overflow-hidden bg-panel transition-opacity md:group-hover:opacity-80">
          {product.defaultImage ? (
            <Image
              src={product.defaultImage}
              alt={`${design.name} — ${product.kind.one}`}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 170px, (min-width: 768px) 22vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-muted">
              {design.name}
            </span>
          )}
        </span>
        <span className="mt-1.5 block text-[11px] leading-[1.08] md:hidden">
          <span className="block">{design.name}</span>
          <span className={`mt-0.5 block ${soldOut ? "text-muted" : ""}`}>
            {soldOut ? "sold out" : formatPrice(design.priceMin)}
          </span>
        </span>
      </Link>
      {isNew && (
        <span className="absolute right-0 top-0 border-b border-l border-faint bg-bg px-1 py-0.5 text-[10px] leading-none text-[#ccc] md:hidden">
          new
        </span>
      )}
      {dialupNew && <span className="dialup-only dialup-new">NEW!</span>}
    </li>
  );
}
