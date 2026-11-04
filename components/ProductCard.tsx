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
 * A catalog tile. Desktop shows only the photo: hovering (or keyboard focus)
 * frames it and shows the price in a small box, and "sold out" sits on the
 * photo permanently. Phones get a bordered cell with the name and price (or
 * "sold out") under it.
 */
export function ProductCard({ design, priority, isNew, dialupNew }: Props) {
  const product = design.products[0];
  const soldOut = !design.products.some((p) => p.variants.some((v) => v.available));
  const price = `${design.priceMin !== design.priceMax ? "from " : ""}${formatPrice(design.priceMin)}`;
  const tag = "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-bg/90 px-2 py-1 text-[15px] leading-tight text-muted max-md:hidden";

  return (
    <li className="mpa-card relative max-md:border-b max-md:border-r max-md:border-faint max-md:p-2">
      <Link
        href={`/products/${design.slug}`}
        title={design.fullName}
        aria-label={`${design.name}, ${soldOut ? "sold out" : price}`}
        className="group block md:border md:border-transparent md:p-1.5 md:hover:border-[#c8c8c8] md:focus-visible:border-[#c8c8c8] md:focus-visible:outline-none"
      >
        <span className="relative block aspect-square overflow-hidden bg-panel">
          {product.defaultImage ? (
            <Image
              src={product.defaultImage}
              alt={design.fullName}
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
          {soldOut ? (
            <span className={tag}>sold out</span>
          ) : (
            <span className={`${tag} opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100`}>{price}</span>
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
