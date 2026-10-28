import type { PrintifyBlueprint, PrintifyProduct } from "./printify";
import { getBlankSpec, type BlankSpec } from "./blanks";
import { POPUP_URL } from "./site";

/**
 * Client-safe, display-ready view of a Printify product. Pages and client
 * components receive this instead of the raw API payload.
 */

export type Tone = "dark" | "light";

export type ColorOption = { id: number; name: string; hex: string; tone: Tone };
export type SizeOption = { id: number; name: string };
export type VariantOption = {
  id: number;
  colorId: number | null;
  sizeId: number | null;
  price: number; // cents
  available: boolean;
};
export type ProductImage = {
  src: string;
  variantIds: number[];
  position: string;
  isDefault: boolean;
};

export type ProductKind = { one: string; many: string };

export type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  fullTitle: string;
  descriptionParagraphs: string[];
  descriptionBullets: string[];
  /** The seller's own words: description paragraphs that aren't the blank's stock copy. */
  story: string[];
  /** Stock product copy for the Details panel (falls back to the blueprint's). */
  details: { paragraphs: string[]; bullets: string[] };
  summary: string;
  tags: string[];
  blueprintId: number;
  blank: BlankSpec | null;
  /** Blank name shown in the design's blank picker, e.g. "American Apparel Classic Tee". */
  blankLabel: string;
  /** URL-safe blank id for ?blank=, e.g. "american-apparel-1301". */
  blankKey: string;
  /** Uploaded artwork ids, sorted; identical sets mean the same design on another blank. */
  artworkKey: string;
  /** Value of a "group:<name>" Printify tag, which overrides artwork matching. */
  groupTag: string | null;
  /** Value of a "name:<Design Name>" Printify tag. */
  nameTag: string | null;
  /** Sized like clothing (S/M/L…) — gates fit copy and the print profile. */
  isGarment: boolean;
  /** Category label, e.g. { one: "Tee", many: "Tees" }. */
  kind: ProductKind;
  /** One-line spec under the product card. */
  cardSpec: string;
  priceMin: number;
  priceMax: number;
  currency: "USD";
  colors: ColorOption[];
  sizes: SizeOption[];
  variants: VariantOption[];
  images: ProductImage[];
  defaultImage: string | null;
  popupUrl: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Slugs: "/products/mcr-bat-tee-68ed6fcded926f86860dfb32"
// Titles aren't unique in Printify, so the product id rides on the end.
// ---------------------------------------------------------------------------

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

export function productSlug(p: Pick<PrintifyProduct, "id" | "title">): string {
  const base = slugify(splitTitle(p.title).title);
  return base ? `${base}-${p.id}` : p.id;
}

export function idFromSlug(slug: string): string | null {
  const match = /([a-f0-9]{24})$/i.exec(slug);
  return match ? match[1].toLowerCase() : null;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** "MCR Bat Tee | Philly 2025 Replica | Comfort Colors 1717" → title + subtitle */
export function splitTitle(raw: string): { title: string; subtitle: string | null } {
  const parts = raw
    .split("|")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return {
    title: parts[0] ?? raw.trim(),
    subtitle: parts.length > 1 ? parts.slice(1).join(" / ") : null,
  };
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&ndash;": "–",
  "&mdash;": "—",
  "&sup2;": "²",
  "&sup3;": "³",
  "&deg;": "°",
  "&times;": "×",
  "&reg;": "®",
  "&trade;": "™",
  "&copy;": "©",
  "&hellip;": "…",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([a-f0-9]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** Printify descriptions are HTML; reduce to plain paragraphs + ".:" bullets. */
export function parseDescription(html: string): { paragraphs: string[]; bullets: string[] } {
  const text = decodeEntities(
    html
      .replace(/<\s*li\b[^>]*>/gi, "\n.: ")
      .replace(/<\s*(br|\/p|\/li|\/div|\/h\d|\/tr)\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s*\.:\s*/g, "\n.: "); // Printify inlines ".:" bullets mid-line
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const paragraphs: string[] = [];
  const bullets: string[] = [];
  for (const line of lines) {
    if (line.startsWith(".:")) bullets.push(line.replace(/^\.:\s*/, ""));
    else paragraphs.push(line);
  }
  return { paragraphs, bullets };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// ---------------------------------------------------------------------------
// Colour tone → which print profile applies
// ---------------------------------------------------------------------------

function relativeLuminance(hex: string): number | null {
  const m = /^#?([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Light garments get the soft-hand print; everything else gets the underbase. */
export function toneForHex(hex: string): Tone {
  const l = relativeLuminance(hex);
  return l !== null && l >= 0.5 ? "light" : "dark";
}

/** "$48" on cards; pass `exact` for "$48.00" on the buy panel. */
export function formatPrice(cents: number, exact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: exact || cents % 100 !== 0 ? 2 : 0,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Pop-Up checkout routing
// ---------------------------------------------------------------------------

/**
 * The product's page on the Printify Pop-Up store, where cart, payment,
 * tax and fulfilment happen. Built from external.id on the configured
 * Pop-Up domain, so pointing NEXT_PUBLIC_POPUP_URL at a custom domain
 * re-routes every buy button.
 */
export function getPopupProductUrl(p: Pick<PrintifyProduct, "external">): string {
  if (p.external?.id) return `${POPUP_URL}/product/${p.external.id}`;
  return p.external?.handle || POPUP_URL;
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const POSTER_BLUEPRINTS = new Set([282]); // Matte vertical posters

function productKind(p: PrintifyProduct, hasBlank: boolean, bp: PrintifyBlueprint | null): ProductKind {
  const tags = (p.tags ?? []).map((t) => t.toLowerCase());
  const has = (...keys: string[]) => keys.some((k) => tags.includes(k));
  if (hasBlank) return { one: "Tee", many: "Tees" };
  if (POSTER_BLUEPRINTS.has(p.blueprint_id) || has("posters", "poster")) return { one: "Print", many: "Prints" };
  if (has("hoodies")) return { one: "Hoodie", many: "Hoodies" };
  if (has("sweatshirts")) return { one: "Crewneck", many: "Crewnecks" };
  if (has("hats")) return { one: "Cap", many: "Headwear" };
  if (has("pet", "pets")) return { one: "Pet Goods", many: "Pet Goods" };
  if (has("t-shirts", "crop tops", "crew neck")) return { one: "Tee", many: "Tees" };
  // Untagged products: go by the blank's catalog title.
  const bpTitle = bp?.title ?? "";
  if (/hood/i.test(bpTitle)) return { one: "Hoodie", many: "Hoodies" };
  if (/sweatshirt|crewneck/i.test(bpTitle)) return { one: "Crewneck", many: "Crewnecks" };
  if (/\b(cap|hat|beanie)\b/i.test(bpTitle)) return { one: "Cap", many: "Headwear" };
  if (/\b(tee|t-shirt|short sleeve)\b/i.test(bpTitle)) return { one: "Tee", many: "Tees" };
  return { one: "Goods", many: "Goods" };
}

const GARMENT_SIZE = /^(XXS|XS|S|M|L|XL|XXL|\d?XL)$/i;

// Storefront control tags set in Printify: "group:ernie", "name:The Ernie Tee".
const CONTROL_TAG = /^(group|name)\s*:\s*(.+)$/i;

function controlTag(tags: string[], key: "group" | "name"): string | null {
  for (const t of tags) {
    const m = CONTROL_TAG.exec(t.trim());
    if (m && m[1].toLowerCase() === key) return m[2].trim();
  }
  return null;
}

// Printify's built-in text layer shares one image id across every product.
const TEXT_LAYER = /^text_layer/i;

function artworkKey(p: PrintifyProduct): string {
  const ids = new Set<string>();
  for (const area of p.print_areas ?? []) {
    for (const ph of area.placeholders) {
      for (const img of ph.images) if (!TEXT_LAYER.test(img.name ?? "")) ids.add(img.id);
    }
  }
  return [...ids].sort().join(",");
}

const normText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Split a description into the seller's story and the blank's stock copy. */
function splitStory(
  own: { paragraphs: string[]; bullets: string[] },
  bp: PrintifyBlueprint | null,
): { story: string[]; details: { paragraphs: string[]; bullets: string[] } } {
  const stock = bp ? parseDescription(bp.description) : { paragraphs: [], bullets: [] };
  const stockText = new Set([...stock.paragraphs, ...stock.bullets].map(normText));
  const isStock = (line: string) => stockText.has(normText(line));
  const story = own.paragraphs.filter((l) => !isStock(l));
  const paragraphs = own.paragraphs.filter(isStock);
  return {
    story,
    details: {
      paragraphs: paragraphs.length ? paragraphs : stock.paragraphs,
      bullets: own.bullets.length ? own.bullets : stock.bullets,
    },
  };
}

const stripMarks = (s: string) => s.replace(/[®™]/g, "").replace(/\s+/g, " ").trim();

/** "Comfort Colors 1717", "American Apparel Classic Tee", … */
function blankLabel(blank: BlankSpec | null, bp: PrintifyBlueprint | null, kind: ProductKind): string {
  if (blank) return blank.name;
  if (!bp) return kind.one;
  const brand = stripMarks(bp.brand);
  const title = stripMarks(bp.title).replace(/^unisex\s+/i, "");
  if (!brand || /^generic/i.test(brand)) return title;
  return title.toLowerCase().startsWith(brand.toLowerCase()) ? title : `${brand} ${title}`;
}

export function toStorefrontProduct(p: PrintifyProduct, blueprint: PrintifyBlueprint | null = null): StorefrontProduct {
  const { title, subtitle } = splitTitle(p.title);
  const { paragraphs, bullets } = parseDescription(p.description || "");

  const colorOptionIndex = p.options.findIndex((o) => o.type === "color");
  const sizeOptionIndex = p.options.findIndex((o) => o.type === "size");
  const colorValues = colorOptionIndex >= 0 ? p.options[colorOptionIndex].values : [];
  const sizeValues = sizeOptionIndex >= 0 ? p.options[sizeOptionIndex].values : [];
  const colorIds = new Set(colorValues.map((v) => v.id));
  const sizeIds = new Set(sizeValues.map((v) => v.id));

  // Variant option order isn't guaranteed to match p.options, so match by id.
  const variants: VariantOption[] = p.variants
    .filter((v) => v.is_enabled)
    .map((v) => ({
      id: v.id,
      colorId: v.options.find((id) => colorIds.has(id)) ?? null,
      sizeId: v.options.find((id) => sizeIds.has(id)) ?? null,
      price: v.price,
      available: v.is_available,
    }));

  const usedColors = new Set(variants.map((v) => v.colorId));
  const usedSizes = new Set(variants.map((v) => v.sizeId));

  const colors: ColorOption[] = colorValues
    .filter((c) => usedColors.has(c.id))
    .map((c) => {
      const hex = c.colors?.[0] ?? "#000000";
      return { id: c.id, name: c.title, hex, tone: toneForHex(hex) };
    });

  const sizes: SizeOption[] = sizeValues
    .filter((s) => usedSizes.has(s.id))
    .map((s) => ({ id: s.id, name: s.title }));

  const isGarment = sizes.some((s) => GARMENT_SIZE.test(s.name.trim()));
  const blank = getBlankSpec(p.blueprint_id);
  const kind = productKind(p, blank !== null, blueprint);
  const { story, details } = splitStory({ paragraphs, bullets }, blueprint);
  const cardSpec =
    blank?.cardSpec ??
    [kind.one, colors.length > 1 ? `${colors.length} Colorways` : "Made to Order"].join(" / ");

  const enabledIds = new Set(variants.map((v) => v.id));
  const images: ProductImage[] = p.images
    .filter((img) => img.is_selected_for_publishing !== false)
    .filter((img) => img.variant_ids.some((id) => enabledIds.has(id)))
    .map((img) => ({
      src: img.src,
      variantIds: img.variant_ids,
      position: img.position,
      isDefault: img.is_default,
    }));

  const prices = variants.map((v) => v.price);
  const defaultImage = (images.find((i) => i.isDefault) ?? images[0])?.src ?? null;
  const summarySource = paragraphs[0] ?? subtitle ?? title;

  return {
    id: p.id,
    slug: productSlug(p),
    title,
    subtitle,
    fullTitle: p.title.replace(/\s+/g, " ").trim(),
    descriptionParagraphs: paragraphs,
    descriptionBullets: bullets,
    story,
    details,
    summary: truncate(summarySource, 155),
    tags: (p.tags ?? []).filter((t) => !CONTROL_TAG.test(t.trim())),
    blueprintId: p.blueprint_id,
    blank,
    blankLabel: blankLabel(blank, blueprint, kind),
    blankKey:
      slugify(blueprint ? `${stripMarks(blueprint.brand)} ${blueprint.model}` : "") || `blank-${p.blueprint_id}`,
    artworkKey: artworkKey(p),
    groupTag: controlTag(p.tags ?? [], "group"),
    nameTag: controlTag(p.tags ?? [], "name"),
    isGarment,
    kind,
    cardSpec,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    currency: "USD",
    colors,
    sizes,
    variants,
    images,
    defaultImage,
    popupUrl: getPopupProductUrl(p),
    updatedAt: p.updated_at,
  };
}
