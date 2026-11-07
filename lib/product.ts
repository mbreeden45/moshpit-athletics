import type { PrintifyBlueprint, PrintifyProduct } from "./printify";
import { getBlankSpec, type BlankSpec } from "./blanks";
import { getGarmentSpec, type GarmentSpec } from "./specs";
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

/** How the design is applied, from Printify's catalog (per print area). */
export type PrintMethod = "dtg" | "embroidery" | "dtf" | "digital";

export type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  fullTitle: string;
  /** The seller's own words about the design: description paragraphs that aren't the blank's stock copy. */
  story: string[];
  /** Decoration methods actually used by this product's artwork. */
  printMethods: PrintMethod[];
  /** Our own spec copy for the blank; Printify's stock text is never shown. */
  spec: GarmentSpec | null;
  /** True when the blank is a named brand, which triggers the brand disclaimer. */
  brandNamed: boolean;
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
  /** When the product was first created in Printify: what "newest" means. */
  createdAt: string;
  /** Last edit in Printify (sitemap freshness only; edits don't make a product new). */
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

/**
 * Telltales of Printify's stock blank copy, for descriptions pasted in before
 * Printify reworded its own (so the exact-match check below misses them).
 */
const STOCK_HINT =
  /\b(introduces the|fully customizable|colou?r charts?|size charts?|discover all \d+ colou?rs|cotton trust protocol)\b/i;

/** Garment brands we print on or might, for keeping blank names out of descriptions. Case-sensitive. */
const BLANK_BRANDS = [
  "Comfort Colors",
  "Shaka Wear",
  "Gildan",
  "Bella+Canvas",
  "Bella + Canvas",
  "Bella Canvas",
  "American Apparel",
  "Next Level",
  "Independent Trading",
  "Cotton Heritage",
  "Lane Seven",
  "Los Angeles Apparel",
  "AS Colour",
  "Jerzees",
  "Hanes",
  "Port & Company",
  "Yupoong",
  "Flexfit",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Matches a sentence that names the blank: a known garment brand, the
 * blueprint's own brand, or its model number (e.g. "1717"). The blank is
 * listed in the product's details instead.
 */
function blankMention(bp: PrintifyBlueprint | null, blank: BlankSpec | null): RegExp {
  const terms = new Set(BLANK_BRANDS);
  const brand = bp ? stripMarks(bp.brand) : "";
  if (brand && !/^generic/i.test(brand)) terms.add(brand);
  if (blank) terms.add(blank.name);
  const models = new Set<string>();
  for (const m of [bp?.model ?? "", ...(blank ? [blank.name] : [])].join(" ").match(/\b[A-Z]*\d{3,}[A-Z]*\b/gi) ?? []) {
    models.add(m);
  }
  const words = [...terms].map((t) => `\\b${escapeRe(t)}\\b`);
  const codes = [...models].map((m) => `\\b${escapeRe(m)}\\b`);
  return new RegExp([...words, ...codes].join("|"));
}

/** Sentences, keeping their end punctuation. */
function sentences(paragraph: string): string[] {
  return paragraph.split(/(?<=[.!?])\s+(?=["“'‘(]?[A-Z0-9])/);
}

/**
 * Etsy-only offers: messaging the seller, custom or case-by-case orders.
 * This site can't take those, so sentences with them are dropped.
 */
const ETSY_ONLY =
  /\b(message (me|us)|send (me|us) a message|(dm|pm) (me|us)|contact me|reach out|custom\w*|case[- ]by[- ]case|personali[sz]\w*|etsy)\b/i;

/**
 * Removes the word "replica" ("Philly 2025 Replica" → "Philly 2025"), which
 * can read as a copy of official band merch; "a replica of X" becomes
 * "inspired by X".
 */
export function dropReplica(text: string): string {
  const out = text
    // Dropping only the word would make it read as the official shirt.
    .replace(/\b((a|an)\s+)?replicas?\s+of\b/gi, "inspired by")
    .replace(/\s*\breplicas?\b/gi, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Keep a leading capital: "A replica of the tour tee" → "Inspired by the tour tee".
  return /^[A-Z]/.test(text.trim()) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

/**
 * The seller's own lines from a description, cleaned for this site: the
 * blank's stock copy removed, sentences that name the blank or offer
 * Etsy-only services dropped, "replica" removed, and paragraphs left empty
 * dropped.
 */
function splitStory(
  own: { paragraphs: string[]; bullets: string[] },
  bp: PrintifyBlueprint | null,
  blank: BlankSpec | null,
): string[] {
  const stock = bp ? parseDescription(bp.description) : { paragraphs: [], bullets: [] };
  const stockText = new Set([...stock.paragraphs, ...stock.bullets].map(normText));
  const isStock = (line: string) => stockText.has(normText(line)) || STOCK_HINT.test(line);
  const namesBlank = blankMention(bp, blank);
  return own.paragraphs
    .map((l) => l.replace(/\*\*|__/g, "").trim()) // Markdown bold pasted from Etsy
    .filter((l) => l && !isStock(l))
    .map((l) =>
      sentences(l)
        .filter((sentence) => !namesBlank.test(sentence) && !ETSY_ONLY.test(sentence))
        .map(dropReplica)
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean);
}

/** The title's extra parts ("Philly 2025 Replica / Comfort Colors 1717"), minus the blank and "replica". */
function cleanSubtitle(subtitle: string | null, bp: PrintifyBlueprint | null, blank: BlankSpec | null): string | null {
  if (!subtitle) return null;
  const namesBlank = blankMention(bp, blank);
  const parts = subtitle
    .split(" / ")
    .filter((part) => !namesBlank.test(part))
    .map(dropReplica)
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

/**
 * A story split at a "Details:" style heading: the prose above it is the
 * product description; the lines below it are notes for the details panel.
 */
/**
 * Lines pasted in from marketplace listings that don't belong in a story on
 * this site: size charts (the size picker and specs cover them), listing
 * boilerplate, and shipping, returns and print-method notes that the site
 * states once, correctly, elsewhere.
 */
const LISTING_JUNK = [
  /^(xxs|xs|s|m|l|xl|xxl|\d?x+l|\dxl)$/i, // size chart columns
  /^[\d.,]+$/, // size chart numbers
  /\b(width|length|sleeve length|tolerance)\b.*,\s*in\.?$/i, // size chart rows
  /^-{2,}$/,
  /^(colou?rs?|sizes?)\s*:/i,
  /^(design features|important notes|item details)\s*:?$/i,
  /\b(ships? within|business days|allow one week|slightly delayed|holidays approach)/i,
  /\bno returns\b|\brefunds?\b/i,
  /\b(dtg|direct to garment|screen ?print)/i,
  /check out my store|reviews (on|from) (that|my)/i,
];

/** The seller's story, cleaned for a "more about this design" section. */
export function storyForDisplay(lines: string[]): string[] {
  return lines
    .map((l) =>
      l
        .replace(/^item details\s*/i, "")
        .replace(/^this is a,?\s*recreated by me,?\s*/i, "Recreated by me, ")
        .trim(),
    )
    .filter((l) => l.length > 0 && !LISTING_JUNK.some((re) => re.test(l)));
}

export function storySections(story: string[]): { about: string[]; notes: string[] } {
  const i = story.findIndex((l) => /^(details|features|specs|product details)\s*:?$/i.test(l.trim()));
  return i === -1 ? { about: story, notes: [] } : { about: story.slice(0, i), notes: story.slice(i + 1) };
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

const METHOD_ALIASES: Record<string, PrintMethod> = {
  dtg: "dtg",
  embroidery: "embroidery",
  dtf: "dtf",
  "digital-printing": "digital",
};

/** Methods for the print areas that actually carry artwork. */
function printMethods(p: PrintifyProduct, byPosition: Record<string, string>): PrintMethod[] {
  const found = new Set<PrintMethod>();
  for (const area of p.print_areas ?? []) {
    for (const ph of area.placeholders) {
      if (ph.images.length === 0) continue;
      const method = METHOD_ALIASES[byPosition[ph.position] ?? ""];
      if (method) found.add(method);
    }
  }
  return [...found];
}

export function toStorefrontProduct(
  p: PrintifyProduct,
  blueprint: PrintifyBlueprint | null = null,
  decorationMethods: Record<string, string> = {},
): StorefrontProduct {
  const { title, subtitle: rawSubtitle } = splitTitle(p.title);
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
  const story = splitStory({ paragraphs, bullets }, blueprint, blank);
  const subtitle = cleanSubtitle(rawSubtitle, blueprint, blank);
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

  return {
    id: p.id,
    slug: productSlug(p),
    title,
    subtitle,
    fullTitle: p.title.replace(/\s+/g, " ").trim(),
    story,
    printMethods: printMethods(p, decorationMethods),
    spec: getGarmentSpec(p.blueprint_id),
    brandNamed: Boolean(blueprint?.brand && !/^generic/i.test(blueprint.brand.trim())),
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
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
