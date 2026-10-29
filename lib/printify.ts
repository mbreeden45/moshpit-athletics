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
  description: string;
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

/**
 * GET /v1/catalog/blueprints/{id}/print_providers/{pid}/variants.json —
 * the decoration method of each print area ("front" → "dtg", "front_embroidery"
 * → "embroidery", …). Empty on failure.
 */
export async function getDecorationMethods(blueprintId: number, providerId: number): Promise<Record<string, string>> {
  if (!env.printifyToken) return {};
  try {
    const res = await printifyFetch<{
      variants: { placeholders: { position: string; decoration_method?: string }[] }[];
    }>(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`);
    const methods: Record<string, string> = {};
    for (const v of res.variants) {
      for (const ph of v.placeholders) {
        if (ph.decoration_method) methods[ph.position] ??= ph.decoration_method;
      }
    }
    return methods;
  } catch (err) {
    console.warn(`[printify] Decoration methods for ${blueprintId}/${providerId} failed:`, err);
    return {};
  }
}

/** GET /v1/catalog/blueprints/{id}.json — the blank's brand and model; null on failure. */
export async function getBlueprint(blueprintId: number): Promise<PrintifyBlueprint | null> {
  if (!env.printifyToken) return null;
  try {
    const { id, title, brand, model, description } = await printifyFetch<PrintifyBlueprint>(
      `/catalog/blueprints/${blueprintId}.json`,
    );
    return { id, title, brand, model, description: description ?? "" };
  } catch (err) {
    console.warn(`[printify] Blueprint ${blueprintId} lookup failed:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orders (checkout on this site; fulfilled by Printify)
// ---------------------------------------------------------------------------

export type PrintifyLineItem = { product_id: string; variant_id: number; quantity: number };

export type PrintifyAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
};

/** Printify shipping_method ids. */
export const SHIPPING_METHOD = { standard: 1, priority: 2 } as const;

async function printifyPost<T>(path: string, body: unknown): Promise<T> {
  if (!env.printifyToken) throw new PrintifyError("PRINTIFY_API_TOKEN is not set", 401);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.printifyToken}`,
      "User-Agent": "MoshPitAthletics-Storefront/1.0",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PrintifyError(`Printify ${res.status} on POST ${path}: ${text.slice(0, 500)}`, res.status);
  }
  return (await res.json()) as T;
}

/**
 * POST /orders/shipping.json — Printify's own shipping cost in cents per method.
 * US rates are flat by product, so any valid US address quotes the same.
 */
export async function quoteShipping(
  lineItems: PrintifyLineItem[],
): Promise<{ standard?: number; priority?: number; express?: number }> {
  const shopId = await resolveShopId();
  return printifyPost(`/shops/${shopId}/orders/shipping.json`, {
    line_items: lineItems,
    address_to: {
      first_name: "Quote",
      last_name: "Only",
      email: "quote@moshpitathletics.com",
      country: "US",
      region: "CA",
      address1: "100 Rose Bowl Dr",
      city: "Pasadena",
      zip: "91103",
    },
  });
}

/** POST /orders.json — returns the new Printify order id. */
export async function createOrder(order: {
  external_id: string;
  label: string;
  line_items: PrintifyLineItem[];
  shipping_method: number;
  address_to: PrintifyAddress;
}): Promise<string> {
  const shopId = await resolveShopId();
  const res = await printifyPost<{ id: string }>(`/shops/${shopId}/orders.json`, {
    ...order,
    send_shipping_notification: true,
  });
  return res.id;
}

/** POST /orders/{id}/send_to_production.json — Printify charges the order and starts printing. */
export async function sendToProduction(orderId: string): Promise<void> {
  const shopId = await resolveShopId();
  await printifyPost(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {});
}
