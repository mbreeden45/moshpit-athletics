"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addLine, loadCart, MAX_QUANTITY, saveCart, type CartItem } from "@/lib/cart";
import { CART_NOTE } from "@/lib/copy";
import { formatPrice } from "@/lib/product";

type CartContextValue = {
  items: CartItem[];
  count: number;
  /** True once the saved bag has been read from the browser. */
  ready: boolean;
  add: (item: CartItem) => void;
  /** Add and go straight to Stripe checkout. */
  buyNow: (item: CartItem) => void;
  setQuantity: (productId: string, variantId: number, quantity: number) => void;
  clear: () => void;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

async function startCheckout(items: CartItem[]): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || "Checkout is unavailable right now. Try again in a moment.");
  window.location.assign(data.url);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
    // Cancelled checkouts come back with ?cart=open.
    if (new URLSearchParams(window.location.search).get("cart") === "open") setIsOpen(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const checkout = useCallback(async (lines: CartItem[]) => {
    setError(null);
    setPending(true);
    try {
      await startCheckout(lines);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsOpen(true);
      setPending(false);
    }
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setIsOpen(true), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      ready: loaded,
      add: (item) => {
        setItems((prev) => addLine(prev, item));
        setError(null);
        setIsOpen(true);
      },
      buyNow: (item) => {
        const next = addLine(items, item);
        setItems(next);
        void checkout(next);
      },
      setQuantity: (productId, variantId, quantity) =>
        setItems((prev) =>
          prev
            .map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        ),
      clear,
      open,
    }),
    [items, loaded, checkout, clear, open],
  );

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <button
            type="button"
            aria-label="Close bag"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-heading"
            className="relative flex h-full w-full max-w-[440px] flex-col border-l border-line bg-ink"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4 uppercase">
              <h2 id="bag-heading">Bag ({value.count})</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="cursor-pointer hover:text-rust">
                Close
              </button>
            </div>

            {items.length === 0 ? (
              <p className="px-5 py-10 uppercase text-muted">Your bag is empty.</p>
            ) : (
              <ul className="flex-1 overflow-y-auto">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.variantId}`} className="flex gap-4 border-b border-line px-5 py-4">
                    <div className="relative size-20 shrink-0 overflow-hidden bg-panel-light">
                      {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="font-display text-[17px] font-bold uppercase leading-[1.1] [font-stretch:80%] hover:text-rust"
                      >
                        {item.name}
                      </Link>
                      <p className="label normal-case tracking-normal">{item.detail}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-edge">
                          <button
                            type="button"
                            aria-label={`Remove one ${item.name}`}
                            onClick={() => value.setQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="cursor-pointer px-2.5 py-1 hover:text-rust"
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Add one ${item.name}`}
                            disabled={item.quantity >= MAX_QUANTITY}
                            onClick={() => value.setQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="cursor-pointer px-2.5 py-1 hover:text-rust disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <span>{formatPrice(item.price * item.quantity, true)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex flex-col gap-4 border-t border-line px-5 py-5">
              {error && (
                <p role="alert" className="text-rust">
                  {error}
                </p>
              )}
              <div className="flex justify-between uppercase">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, true)}</span>
              </div>
              <p className="label normal-case tracking-normal">{CART_NOTE}</p>
              <button
                type="button"
                disabled={items.length === 0 || pending}
                onClick={() => void checkout(items)}
                className="cursor-pointer border border-paper bg-paper p-5 text-center text-[14px] font-medium uppercase tracking-[0.06em] text-ink hover:border-rust hover:bg-rust hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Opening checkout…" : "Checkout"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </CartContext.Provider>
  );
}

/** Header "Bag (n)" button. */
export function BagButton() {
  const { count, open } = useCart();
  return (
    <button type="button" onClick={open} className="cursor-pointer uppercase hover:text-rust">
      Bag{count > 0 && ` (${count})`}
    </button>
  );
}
