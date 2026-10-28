import { slugify, splitTitle, type StorefrontProduct } from "./product";

/**
 * A design is one artwork sold on one or more blanks. Printify keeps each
 * blank as its own product (and its own Pop-Up checkout page); the storefront
 * merges them into one card and one product page with a blank picker.
 *
 * Products group automatically when their uploaded artwork matches exactly.
 * A "group:<anything>" tag in Printify overrides that: products sharing the
 * tag merge, and a tagged product never merges with untagged ones.
 */

export type StorefrontDesign = {
  key: string;
  slug: string;
  name: string;
  /** One entry per blank, lead blank first. */
  products: StorefrontProduct[];
  priceMin: number;
  priceMax: number;
  cardSpec: string;
  updatedAt: string;
};

/** Lead blank order; anything unlisted follows, newest first. */
const BLANK_ORDER = [
  1716, // Shaka Wear Max Heavyweight
  706, // Comfort Colors 1717
];

/**
 * Storefront names, keyed by any Printify product id in the design.
 * A "name:<Design Name>" tag in Printify takes precedence.
 */
const DESIGN_NAMES: Record<string, string> = {
  "6a4d7e600e9c38654108213b": "The Ernie Tee",
  "69d454edf6c67e08bf06d7b8": "The Davis Tee",
  "6a7f60333e15472e280b0695": "The Rose Bowl Tee",
  "6a7f6507efd4d89d1e0bb81b": "The Rose Bowl Print",
  "6a99f8b475e2ac9a620571b9": "The Canada Day Clash Tee",
  "6ae253dc0626d40cc4067419": "The Pasadena Cap",
  "6a42a14d0fd2a5d6020bf2c2": "The Torrance Rope Cap",
  "69377e0a9837d19d390e5578": "The Peripheral Clown Tee",
  "693769c56a099916980abb74": "The Detroit Tiger Tee",
  "690ba5cec66e799d2a063832": "The Dojasu Logo Tee",
  "68f068010f158415e405017c": "The Dojasu Boys Tee",
  "68ed6fceed926f86860dfb34": "The Philly Bats Hoodie",
  "68ed6fcded926f86860dfb32": "The Philly Bats Tee",
  "68ed6fcaed926f86860dfb2f": "The Turnoverstile Tee",
  "68ed6fc6ed926f86860dfb2d": "The Flagg Bars Tee",
  "68ed6fc4ed926f86860dfb29": "The Black Heaven Tee",
  "68ed6fc2ed926f86860dfb28": "The Scythe Tee",
};

function groupKey(p: StorefrontProduct): string {
  if (p.groupTag) return `tag:${slugify(p.groupTag)}`;
  // Same artwork on a cap and a tee stays two designs.
  if (p.artworkKey) return `art:${p.kind.one}:${p.artworkKey}`;
  return `id:${p.id}`;
}

function blankRank(p: StorefrontProduct): number {
  const i = BLANK_ORDER.indexOf(p.blueprintId);
  return i === -1 ? BLANK_ORDER.length : i;
}

/** Fallback for unnamed designs: "Ernie - Unisex Max Heavyweight…" → "Ernie". */
function derivedName(lead: StorefrontProduct): string {
  return lead.title.split(/\s+[-–—]\s+|\s+on\s+/i)[0].trim() || splitTitle(lead.fullTitle).title;
}

function designName(products: StorefrontProduct[]): string {
  return (
    products.find((p) => p.nameTag)?.nameTag ??
    products.map((p) => DESIGN_NAMES[p.id]).find(Boolean) ??
    derivedName(products[0])
  );
}

/** Products arrive newest first; designs keep that order by their newest blank. */
export function groupDesigns(products: StorefrontProduct[]): StorefrontDesign[] {
  const groups = new Map<string, StorefrontProduct[]>();
  for (const p of products) {
    const key = groupKey(p);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }

  const usedSlugs = new Set<string>();
  const designs: StorefrontDesign[] = [];

  for (const [key, members] of groups) {
    const ordered = members
      .map((p, i) => ({ p, i }))
      .sort((a, b) => blankRank(a.p) - blankRank(b.p) || a.i - b.i)
      .map(({ p }) => p);

    // Two products on the same blank still need distinct ?blank= values.
    const seenKeys = new Map<string, number>();
    const blanks = ordered.map((p) => {
      const n = (seenKeys.get(p.blankKey) ?? 0) + 1;
      seenKeys.set(p.blankKey, n);
      return n === 1 ? p : { ...p, blankKey: `${p.blankKey}-${n}` };
    });

    const name = designName(blanks);
    let slug = slugify(name) || blanks[0].id;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(name)}-${n}`;
    usedSlugs.add(slug);

    const lead = blanks[0];
    designs.push({
      key,
      slug,
      name,
      products: blanks,
      priceMin: Math.min(...blanks.map((p) => p.priceMin)),
      priceMax: Math.max(...blanks.map((p) => p.priceMax)),
      cardSpec: blanks.length > 1 ? `${lead.kind.one} / ${blanks.length} Blanks` : lead.cardSpec,
      updatedAt: blanks.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), lead.updatedAt),
    });
  }

  return designs;
}
