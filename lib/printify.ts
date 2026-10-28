import "server-only";
import { env } from "./env";

/**
 * Printify REST API client (https://developers.printify.com/).
 * Every request is cached through the Next.js data cache and revalidated hourly.
 */

const API_BASE = "https://api.printify.com/v1";
export const REVALIDATE_SECONDS = 3600;
// Each product carries every variant (often 400+), so a page of 50 runs ~2.7 MB —
// over Next's 2 MB per-entry data-cache limit. Pages of 10 stay well under.
const PAGE_LIMIT = 10;
const POPUP_SALES_CHANNEL = "storefront"; // Printify Pop-Up Store
const SHOP_TITLE = "Mosh Pit Athletics";

// ---------------------------------------------------------------------------
// Types (subset of the Printify product payload we rely on)
// ---------------------------------------------------------------------------

export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyOptionValue = {
  id: number;
  title: string;
  colors?: string[];
};

export type PrintifyOption = {
  name: string;
  type: "size" | "color" | string;
  values: PrintifyOptionValue[];
};

export type PrintifyVariant = {
  id: number;
  sku: string;
  cost: number;
  price: number; // cents
  title: string;
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  options: number[];
};

export type PrintifyImage = {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
  is_selected_for_publishing?: boolean;
};

export type PrintifyPrintArea = {
  variant_ids: number[];
  placeholders: { position: string; images: { id: string; name?: string }[] }[];
};

export type PrintifyBlueprint = {
  id: number;
  title: string;
  brand: string;
  model: string;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PrintifyOption[];
  variants: PrintifyVariant[];
  images: PrintifyImage[];
  print_areas?: PrintifyPrintArea[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  is_deleted?: boolean;
  blueprint_id: number;
  print_provider_id: number;
  shop_id: number;
  external?: { id: string; handle: string } | null;
};

type Paginated<T> = {
  current_page: number;
  last_page: number;
  data: T[];
};

export class PrintifyError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PrintifyError";
  }
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function printifyFetch<T>(path: string): Promise<T> {
  if (!env.printifyToken) {
    throw new PrintifyError("PRINTIFY_API_TOKEN is not set", 401);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${env.printifyToken}`,
      "User-Agent": "MoshPitAthletics-Storefront/1.0",
      Accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["printify"] },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PrintifyError(
      `Printify ${res.status} on ${path}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Shop discovery
// ---------------------------------------------------------------------------

/** GET /v1/shops.json */
export async function getShops(): Promise<PrintifyShop[]> {
  return printifyFetch<PrintifyShop[]>("/shops.json");
}

/** Pick the Mosh Pit Athletics Pop-Up store out of the account's shops. */
export function findPopupShop(shops: PrintifyShop[]): PrintifyShop | null {
  const popups = shops.filter((s) => s.sales_channel === POPUP_SALES_CHANNEL);
  return (
    popups.find((s) => s.title.trim().toLowerCase() === SHOP_TITLE.toLowerCase()) ??
    popups[0] ??
    null
  );
}

/** PRINTIFY_SHOP_ID if set, otherwise discovered live via shops.json. */
export async function resolveShopId(): Promise<string> {
  if (env.printifyShopId) return env.printifyShopId;
  const shop = findPopupShop(await getShops());
  if (!shop) {
    throw new PrintifyError(
      `No Printify Pop-Up ("${POPUP_SALES_CHANNEL}") shop found on this account`,
      404,
    );
  }
  return String(shop.id);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * A product is "published" to the storefront when it is visible and has
 * been pushed to the Pop-Up store (which assigns external.id / handle).
 */
export function isPublished(p: PrintifyProduct): boolean {
  return Boolean(p.visible && !p.is_deleted && p.external?.id && p.external.handle);
}

/** GET /v1/shops/{shop_id}/products.json — all pages, published only. */
export async function getProducts(): Promise<PrintifyProduct[]> {
  if (!env.printifyToken) {
    console.warn("[printify] PRINTIFY_API_TOKEN missing — rendering an empty catalog.");
    return [];
  }

  const shopId = await resolveShopId();
  const all: PrintifyProduct[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await printifyFetch<Paginated<PrintifyProduct>>(
      `/shops/${shopId}/products.json?limit=${PAGE_LIMIT}&page=${page}`,
    );
    all.push(...res.data);
    lastPage = res.last_page;
    page += 1;
  } while (page <= lastPage);

  return all.filter(isPublished);
}

/** GET /v1/shops/{shop_id}/products/{product_id}.json — null if missing/unpublished. */
export async function getProduct(productId: string): Promise<PrintifyProduct | null> {
  if (!env.printifyToken || !/^[a-f0-9]{24}$/i.test(productId)) return null;

  const shopId = await resolveShopId();
  try {
    const product = await printifyFetch<PrintifyProduct>(
      `/shops/${shopId}/products/${productId}.json`,
    );
    return isPublished(product) ? product : null;
  } catch (err) {
    if (err instanceof PrintifyError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    throw err;
  }
}

/** GET /v1/catalog/blueprints/{id}.json — the blank's brand and model; null on failure. */
export async function getBlueprint(blueprintId: number): Promise<PrintifyBlueprint | null> {
  if (!env.printifyToken) return null;
  try {
    const { id, title, brand, model } = await printifyFetch<PrintifyBlueprint>(
      `/catalog/blueprints/${blueprintId}.json`,
    );
    return { id, title, brand, model };
  } catch (err) {
    console.warn(`[printify] Blueprint ${blueprintId} lookup failed:`, err);
    return null;
  }
}
