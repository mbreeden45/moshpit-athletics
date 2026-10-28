import "server-only";
import { cache } from "react";
import { getProduct, getProducts } from "./printify";
import { idFromSlug, toStorefrontProduct, type StorefrontProduct } from "./product";

/** Server-side data access used by pages, sitemap and metadata. */

export const getCatalog = cache(async (): Promise<StorefrontProduct[]> => {
  const products = await getProducts();
  return products
    .map(toStorefrontProduct)
    .filter((p) => p.variants.length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
});

/** Resolve a PDP slug to a product via GET /products/{id}.json. */
export const getCatalogProduct = cache(
  async (slug: string): Promise<StorefrontProduct | null> => {
    const id = idFromSlug(slug);
    if (!id) return null;
    const product = await getProduct(id);
    if (!product) return null;
    const view = toStorefrontProduct(product);
    return view.variants.length > 0 ? view : null;
  },
);
