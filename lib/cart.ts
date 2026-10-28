/**
 * Cart line as stored in the browser. Display fields are a snapshot for the
 * drawer; the checkout route re-prices every line from Printify, so nothing
 * here is trusted for money.
 */
export type CartItem = {
  productId: string;
  variantId: number;
  quantity: number;
  /** Design page, for linking back from the drawer. */
  slug: string;
  name: string;
  /** "Shaka Wear Max Heavyweight / Black / L" */
  detail: string;
  price: number; // cents
  image: string | null;
};

export const MAX_QUANTITY = 10;
export const MAX_LINES = 20;

const STORAGE_KEY = "mpa-cart-v1";

export function loadCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]).filter((i) => i?.productId && i?.variantId) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private mode or blocked storage: the cart still works for this page view.
  }
}

/** Add a line, merging with an existing line for the same variant. */
export function addLine(items: CartItem[], item: CartItem): CartItem[] {
  const i = items.findIndex((x) => x.productId === item.productId && x.variantId === item.variantId);
  if (i === -1) return [...items, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) }].slice(-MAX_LINES);
  return items.map((x, j) => (j === i ? { ...x, quantity: Math.min(x.quantity + item.quantity, MAX_QUANTITY) } : x));
}
