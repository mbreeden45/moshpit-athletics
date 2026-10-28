import Image from "next/image";
import Link from "next/link";
import { formatPrice, type StorefrontProduct } from "@/lib/product";

export function ProductCard({ product, priority }: { product: StorefrontProduct; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  const swatches = product.colors.slice(0, 6);
  const extra = product.colors.length - swatches.length;

  return (
    <article className="group flex flex-col border border-line bg-ink-2">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-ink-3">
        {product.defaultImage ? (
          <Image
            src={product.defaultImage}
            alt={product.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="display absolute inset-0 grid place-items-center text-3xl text-muted">MPA</span>
        )}
        {product.blank && (
          <span className="eyebrow absolute left-3 top-3 bg-ink px-2 py-1 text-paper">{product.blank.name}</span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-snug">
            <Link href={href} className="hover:text-signal">
              {product.title}
            </Link>
          </h3>
          <p className="shrink-0 font-mono text-sm">
            {product.priceMin !== product.priceMax && <span className="text-muted">from </span>}
            {formatPrice(product.priceMin)}
          </p>
        </div>

        {swatches.length > 0 && (
          <ul className="flex items-center gap-1.5" aria-label={`${product.colors.length} colors`}>
            {swatches.map((c) => (
              <li key={c.id} title={c.name} className="size-3.5 rounded-full border border-paper/30" style={{ backgroundColor: c.hex }} />
            ))}
            {extra > 0 && <li className="eyebrow ml-1 text-muted">+{extra}</li>}
          </ul>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Link href={href} className="eyebrow border border-line px-3 py-2.5 text-center hover:border-paper">
            Details
          </Link>
          <a
            href={product.popupUrl}
            className="eyebrow bg-paper px-3 py-2.5 text-center font-semibold text-ink transition-colors hover:bg-signal hover:text-paper"
          >
            Buy Now
          </a>
        </div>
      </div>
    </article>
  );
}
