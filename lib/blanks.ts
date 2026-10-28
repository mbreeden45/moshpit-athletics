/**
 * Garment blank specifications, attached to products by Printify blueprint_id.
 * Measurements are flat garment dimensions in inches: chest (pit to pit) x
 * body length (high point shoulder to hem).
 */

export type SizeMeasurement = { chest: number; length: number };

export type BlankSpec = {
  key: "comfort-colors-1717" | "shaka-wear-max-heavyweight";
  name: string;
  weight: string;
  fabric: string;
  collar: string;
  cut: string;
  /** One-line spec under product cards, e.g. "7.5 oz Heavyweight Cotton / Boxy Fit". */
  cardSpec: string;
  measurements: Record<string, SizeMeasurement>;
};

export const COMFORT_COLORS_1717: BlankSpec = {
  key: "comfort-colors-1717",
  name: "Comfort Colors 1717",
  weight: "6.1 oz",
  fabric: "Ring-spun garment-dyed cotton",
  collar: '3/4" collar',
  cut: "Vintage boxy drape",
  cardSpec: "6.1 oz Garment-Dyed Cotton / Boxy Fit",
  measurements: {
    S: { chest: 18.25, length: 26.6 },
    M: { chest: 20.25, length: 28 },
    L: { chest: 22, length: 29.4 },
    XL: { chest: 24, length: 30.75 },
    "2XL": { chest: 26, length: 31.6 },
  },
};

export const SHAKA_WEAR_MAX_HEAVYWEIGHT: BlankSpec = {
  key: "shaka-wear-max-heavyweight",
  name: "Shaka Wear Max Heavyweight",
  weight: "7.5 oz / 255 GSM",
  fabric: "Combed cotton",
  collar: '1" thick ribbed neckband',
  cut: "Structured dropped-shoulder cut",
  cardSpec: "7.5 oz Heavyweight Cotton / Boxy Fit",
  measurements: {
    S: { chest: 18, length: 28 },
    M: { chest: 20, length: 29 },
    L: { chest: 22, length: 31 },
    XL: { chest: 24, length: 32 },
    "2XL": { chest: 26, length: 33 },
  },
};

/** Printify catalog blueprint IDs → blank spec. */
const BLANKS_BY_BLUEPRINT: Record<number, BlankSpec> = {
  706: COMFORT_COLORS_1717, // Comfort Colors 1717 Unisex Garment-Dyed T-shirt
  1716: SHAKA_WEAR_MAX_HEAVYWEIGHT, // Shaka Wear SHMHSS Unisex Max Heavyweight Short Sleeve
};

export function getBlankSpec(blueprintId: number): BlankSpec | null {
  return BLANKS_BY_BLUEPRINT[blueprintId] ?? null;
}

/** Normalise Printify size titles ("XXL", "2X") onto our table keys. */
function normaliseSize(size: string): string {
  const s = size.trim().toUpperCase();
  if (s === "XXL" || s === "2X") return "2XL";
  return s;
}

export function getMeasurement(
  blank: BlankSpec | null,
  size: string,
): SizeMeasurement | null {
  if (!blank) return null;
  return blank.measurements[normaliseSize(size)] ?? null;
}

export function formatInches(n: number): string {
  return `${n}"`;
}
