import type { PrintifyProduct } from "./printify";
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

export type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  fullTitle: string;
  descriptionParagraphs: string[];
  descriptionBullets: string[];
  summary: string;
  tags: string[];
  blueprintId: number;
  blank: BlankSpec | null;
  /** Sized like clothing (S/M/L…) — gates fit copy and the print profile. */
  isGarment: boolean;
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
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** Printify descriptions are HTML; reduce to plain paragraphs + ".:" bullets. */
export function parseDescription(html: string): { paragraphs: string[]; bullets: string[] } {
  const text = decodeEntities(
    html
      .replace(/<\s*(br|\/p|\/li|\/div|\/h\d|\/tr)\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
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

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
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

const GARMENT_SIZE = /^(XXS|XS|S|M|L|XL|XXL|\d?XL)$/i;

export function toStorefrontProduct(p: PrintifyProduct): StorefrontProduct {
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
    summary: truncate(summarySource, 155),
    tags: p.tags ?? [],
    blueprintId: p.blueprint_id,
    blank: getBlankSpec(p.blueprint_id),
    isGarment,
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
