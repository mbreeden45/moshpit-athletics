import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/lib/cart";
import type { StorefrontDesign } from "@/lib/designs";
import { formatPrice } from "@/lib/product";
import { QuickAddSizes } from "./QuickAddSizes";

const PILL_SIZES = 5;

/** Quick-add lines for the lead blank in its default color, one per available size. */
function quickAddItems(design: StorefrontDesign): (CartItem & { size: string })[] {
  const product = design.products[0];
  if (!product.isGarment) return [];
  const def = product.images.find((i) => i.isDefault);
  const colorId =
    product.variants.find((v) => def?.variantIds.includes(v.id))?.colorId ?? product.colors[0]?.id ?? null;
  const color = product.colors.find((c) => c.id === colorId);
  return product.sizes
    .flatMap((s) => {
      const variant = product.variants.find((v) => v.colorId === colorId && v.sizeId === s.id && v.available);
      if (!variant) return [];
      return [
        {
          size: s.name,
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          slug: design.slug,
          name: design.name,
          detail: [design.products.length > 1 ? design.optionLabels[0] : null, color?.name, s.name]
            .filter(Boolean)
            .join(" / "),
          price: variant.price,
          image: product.defaultImage,
        },
      ];
    })
    .slice(0, PILL_SIZES);
}

export function ProductCard({ design, priority, isNew }: { design: StorefrontDesign; priority?: boolean; isNew?: boolean }) {
  const product = design.products[0];
  const href = `/products/${design.slug}`;
  const light = product.colors[0]?.tone === "light";

  return (
    <article className="mpa-card group flex flex-col gap-3.5 bg-ink p-3">
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
        <QuickAddSizes items={quickAddItems(design)} />
        {isNew && <span className="dialup-only dialup-new">NEW!</span>}
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
