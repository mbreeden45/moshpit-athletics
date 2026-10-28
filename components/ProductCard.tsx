import Image from "next/image";
import Link from "next/link";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice } from "@/lib/product";

const PILL_SIZES = 5;

export function ProductCard({ design, priority }: { design: StorefrontDesign; priority?: boolean }) {
  const product = design.products[0];
  const href = `/products/${design.slug}`;
  const light = product.colors[0]?.tone === "light";
  // Quick-buy size pills; each routes to this item on the Pop-Up store.
  const pills = product.isGarment ? product.sizes.slice(0, PILL_SIZES) : [];

  return (
    <article className="group flex flex-col gap-3.5 bg-ink p-3">
      <div
        className={`relative aspect-[4/5] overflow-hidden ${light ? "bg-panel-light" : "bg-panel"}`}
      >
        <Link href={href} className="absolute inset-0" aria-label={design.name}>
          {product.defaultImage ? (
            <Image
              src={product.defaultImage}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, (min-width: 540px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="label absolute bottom-3 left-3 text-placeholder">Photo: {design.name}</span>
          )}
        </Link>
        {pills.length > 0 && (
          <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex justify-end gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
            {pills.map((s) => (
              <a
                key={s.id}
                href={product.popupUrl}
                aria-label={`Buy ${design.name} in ${s.name}`}
                className="border border-paper bg-ink px-[9px] py-1.5 text-[11px] text-paper hover:bg-paper hover:text-ink"
              >
                {s.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3 font-display text-[19px] font-bold uppercase leading-[1.1] tracking-normal [font-stretch:80%]">
        <h3>
          <Link href={href} className="hover:text-rust">
            {design.name}
          </Link>
        </h3>
        <span className="shrink-0 font-mono text-[13px] font-normal">
          {design.priceMin !== design.priceMax && <span className="text-muted">From </span>}
          {formatPrice(design.priceMin)}
        </span>
      </div>
      <p className="label -mt-1.5">{design.cardSpec}</p>
    </article>
  );
}
