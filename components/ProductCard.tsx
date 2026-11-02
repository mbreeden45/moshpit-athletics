import Image from "next/image";
import Link from "next/link";
import type { StorefrontDesign } from "@/lib/designs";

/** A catalog tile: just the photo. The name lives in the alt text and the link's accessible name. */
export function ProductCard({ design, priority, isNew }: { design: StorefrontDesign; priority?: boolean; isNew?: boolean }) {
  const product = design.products[0];
  return (
    <li className="mpa-card relative">
      <Link
        href={`/products/${design.slug}`}
        title={design.name}
        className="relative block aspect-square overflow-hidden bg-panel transition-opacity hover:opacity-80"
      >
        {product.defaultImage ? (
          <Image
            src={product.defaultImage}
            alt={`${design.name} — ${product.kind.one}`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 170px, (min-width: 640px) 30vw, 45vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-muted">
            {design.name}
          </span>
        )}
      </Link>
      {isNew && <span className="dialup-only dialup-new">NEW!</span>}
    </li>
  );
}
