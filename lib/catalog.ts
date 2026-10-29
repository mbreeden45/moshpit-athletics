import "server-only";
import { cache } from "react";
import { groupDesigns, type StorefrontDesign } from "./designs";
import { getBlueprint, getDecorationMethods, getProducts } from "./printify";
import { idFromSlug, toStorefrontProduct, type StorefrontProduct } from "./product";

/** Server-side data access used by pages, sitemap and metadata. */

export const getCatalog = cache(async (): Promise<StorefrontProduct[]> => {
  const products = await getProducts();
  const blueprintIds = [...new Set(products.map((p) => p.blueprint_id))];
  const providerKeys = [...new Set(products.map((p) => `${p.blueprint_id}/${p.print_provider_id}`))];
  const [blueprints, methods] = await Promise.all([
    Promise.all(blueprintIds.map(async (id) => [id, await getBlueprint(id)] as const)).then((e) => new Map(e)),
    Promise.all(
      providerKeys.map(async (key) => {
        const [bp, pp] = key.split("/").map(Number);
        return [key, await getDecorationMethods(bp, pp)] as const;
      }),
    ).then((e) => new Map(e)),
  ]);
  return products
    .map((p) =>
      toStorefrontProduct(
        p,
        blueprints.get(p.blueprint_id) ?? null,
        methods.get(`${p.blueprint_id}/${p.print_provider_id}`) ?? {},
      ),
    )
    .filter((p) => p.variants.length > 0)
    // Newest first by creation date, so editing a product doesn't re-list it as new.
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

/** One entry per artwork, each carrying every blank it's printed on. */
export const getDesigns = cache(async (): Promise<StorefrontDesign[]> => {
  return groupDesigns(await getCatalog());
});

export type DesignLookup =
  | { design: StorefrontDesign; redirectTo?: undefined }
  | { design?: undefined; redirectTo: string }
  | null;

/**
 * Resolve a PDP slug. Old per-product URLs ("…-6a4d7e600e9c38654108213b")
 * resolve to a redirect onto the design page with that blank selected.
 */
export const getDesignBySlug = cache(async (slug: string): Promise<DesignLookup> => {
  const designs = await getDesigns();
  const design = designs.find((d) => d.slug === slug);
  if (design) return { design };

  const id = idFromSlug(slug);
  if (!id) return null;
  for (const d of designs) {
    const product = d.products.find((p) => p.id === id);
    if (product) {
      const query = d.products.length > 1 ? `?blank=${product.blankKey}` : "";
      return { redirectTo: `/products/${d.slug}${query}` };
    }
  }
  return null;
});
