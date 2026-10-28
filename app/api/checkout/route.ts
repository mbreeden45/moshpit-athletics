import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { MAX_LINES, MAX_QUANTITY } from "@/lib/cart";
import { getCatalog, getDesigns } from "@/lib/catalog";
import { STRIPE_SUBMIT_NOTE } from "@/lib/copy";
import { quoteShipping, SHIPPING_METHOD, type PrintifyLineItem } from "@/lib/printify";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/checkout — { items: [{ productId, variantId, quantity }] } → { url }
 *
 * Re-prices every line from the live Printify catalog (the browser's prices
 * are display-only), quotes Printify shipping for the cart, and opens a
 * Stripe-hosted Checkout Session. Each line carries its Printify ids in
 * product metadata so the webhook can place the order.
 */

type RequestItem = { productId: string; variantId: number; quantity: number };

function parseItems(body: unknown): RequestItem[] | null {
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) return null;
  const parsed: RequestItem[] = [];
  for (const raw of items) {
    const { productId, variantId, quantity } = (raw ?? {}) as Record<string, unknown>;
    if (typeof productId !== "string" || !/^[a-f0-9]{24}$/i.test(productId)) return null;
    if (!Number.isInteger(variantId) || !Number.isInteger(quantity)) return null;
    if ((quantity as number) < 1 || (quantity as number) > MAX_QUANTITY) return null;
    parsed.push({ productId, variantId: variantId as number, quantity: quantity as number });
  }
  return parsed;
}

/** Round shipping up to the next whole dollar. */
const roundUpDollar = (cents: number) => Math.ceil(cents / 100) * 100;

function shippingOption(
  label: string,
  cents: number,
  method: number,
): Stripe.Checkout.SessionCreateParams.ShippingOption {
  return {
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: label,
      fixed_amount: { amount: roundUpDollar(cents), currency: "usd" },
      metadata: { printify_shipping_method: String(method) },
    },
  };
}

export async function POST(req: NextRequest) {
  const items = parseItems(await req.json().catch(() => null));
  if (!items) return NextResponse.json({ error: "Your bag couldn't be read. Refresh and try again." }, { status: 400 });

  const [catalog, designs] = await Promise.all([getCatalog(), getDesigns()]);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const printifyItems: PrintifyLineItem[] = [];

  for (const item of items) {
    const product = catalog.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    const design = designs.find((d) => d.products.some((p) => p.id === item.productId));
    if (!product || !variant || !variant.available || !design) {
      return NextResponse.json(
        { error: "Something in your bag is no longer available. Remove it and try again." },
        { status: 409 },
      );
    }
    const color = product.colors.find((c) => c.id === variant.colorId)?.name;
    const size = product.sizes.find((s) => s.id === variant.sizeId)?.name;
    const blankIndex = design.products.findIndex((p) => p.id === product.id);
    const image = product.images.find((img) => img.variantIds.includes(variant.id))?.src ?? product.defaultImage;

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: variant.price,
        product_data: {
          name: design.name,
          description:
            [design.products.length > 1 ? design.optionLabels[blankIndex] : null, color, size]
              .filter(Boolean)
              .join(" / ") || undefined,
          images: image ? [image] : undefined,
          metadata: { printify_product_id: product.id, printify_variant_id: String(variant.id) },
        },
      },
    });
    printifyItems.push({ product_id: product.id, variant_id: variant.id, quantity: item.quantity });
  }

  let quote: Awaited<ReturnType<typeof quoteShipping>>;
  try {
    quote = await quoteShipping(printifyItems);
  } catch (err) {
    console.error("[checkout] Printify shipping quote failed:", err);
    return NextResponse.json({ error: "Shipping couldn't be calculated. Try again in a moment." }, { status: 503 });
  }
  const shippingOptions = [
    quote.standard ? shippingOption("Standard shipping", quote.standard, SHIPPING_METHOD.standard) : null,
    quote.priority ? shippingOption("Express shipping", quote.priority, SHIPPING_METHOD.priority) : null,
  ].filter((o) => o !== null);
  if (shippingOptions.length === 0) {
    return NextResponse.json({ error: "These items can't ship right now." }, { status: 409 });
  }

  const origin = req.nextUrl.origin;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: shippingOptions,
      custom_text: { submit: { message: STRIPE_SUBMIT_NOTE } },
      success_url: `${origin}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cart=open`,
      payment_intent_data: { description: "Mosh Pit Athletics order" },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe session failed:", err);
    return NextResponse.json({ error: "Checkout is unavailable right now. Try again in a moment." }, { status: 502 });
  }
}
