import type { StorefrontDesign } from "./designs";
import { slugify } from "./product";

/**
 * Shop categories, derived from each product's kind ("Tees", "Headwear"…).
 * A design shows under every category its blanks belong to, so a graphic
 * printed on a tee and a hoodie is listed under both.
 */

export type Category = {
  /** URL segment: /collections/<slug> */
  slug: string;
  /** Nav label, e.g. "tees". */
  label: string;
  /** Page title and heading, e.g. "Tees". */
  title: string;
  designs: StorefrontDesign[];
};

/** Nav order; kinds not listed here follow alphabetically. */
const ORDER = ["tees", "hoodies", "crewnecks", "headwear", "prints"];

export function getCategories(designs: StorefrontDesign[]): Category[] {
  const map = new Map<string, Category>();
  for (const d of designs) {
    for (const many of new Set(d.products.map((p) => p.kind.many))) {
      const slug = slugify(many);
      const cat = map.get(slug) ?? { slug, label: many.toLowerCase(), title: many, designs: [] };
      cat.designs.push(d);
      map.set(slug, cat);
    }
  }
  const rank = (slug: string) => {
    const i = ORDER.indexOf(slug);
    return i === -1 ? ORDER.length : i;
  };
  return [...map.values()].sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
}

/** The category a design is filed under first (its lead blank's kind). */
export function primaryCategory(design: StorefrontDesign): { slug: string; title: string } {
  const many = design.products[0].kind.many;
  return { slug: slugify(many), title: many };
}
