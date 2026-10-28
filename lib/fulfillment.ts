import "server-only";
import type Stripe from "stripe";
import { env } from "./env";
import { createOrder, SHIPPING_METHOD, sendToProduction, type PrintifyLineItem } from "./printify";
import { getStripe } from "./stripe";

/**
 * Turns a paid Stripe Checkout Session into a Printify order.
 *
 * Progress is recorded on the PaymentIntent's metadata (printify_order_id,
 * printify_status), so a retried webhook resumes instead of ordering twice,
 * and any failure is visible on the payment in the Stripe dashboard.
 *
 * Test-mode payments never reach production: by default they only log the
 * order Printify would receive; PRINTIFY_TEST_ORDERS=draft creates the order
 * in Printify without sending it to print.
 */
export async function fulfillCheckoutSession(sessionId: string, livemode: boolean): Promise<void> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "shipping_cost.shipping_rate"],
  });
  if (session.payment_status !== "paid") return;

  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  if (!pi) throw new Error(`Session ${sessionId} has no PaymentIntent`);
  const status = pi.metadata.printify_status;
  if (status === "sent" || status === "draft" || status === "dry-run") return;

  const mark = (metadata: Record<string, string>) =>
    stripe.paymentIntents.update(pi.id, { metadata: { ...metadata, printify_error: "" } });

  try {
    // Resume: the order exists but didn't make it to production last time.
    if (pi.metadata.printify_order_id && status === "created") {
      if (livemode) {
        await sendToProduction(pi.metadata.printify_order_id);
        await mark({ printify_status: "sent" });
      }
      return;
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
    });
    const items: PrintifyLineItem[] = lineItems.data.map((li) => {
      const product = li.price?.product as Stripe.Product | undefined;
      const productId = product?.metadata.printify_product_id;
      const variantId = Number(product?.metadata.printify_variant_id);
      if (!productId || !variantId) throw new Error(`Line "${li.description}" is missing Printify ids`);
      return { product_id: productId, variant_id: variantId, quantity: li.quantity ?? 1 };
    });

    const shipping = session.collected_information?.shipping_details;
    const address = shipping?.address;
    if (!shipping || !address?.line1 || !address.city || !address.postal_code || !address.state) {
      throw new Error(`Session ${sessionId} has no complete shipping address`);
    }
    const nameParts = shipping.name.trim().split(/\s+/);
    const rate = session.shipping_cost?.shipping_rate as Stripe.ShippingRate | null | undefined;

    const order = {
      external_id: session.id,
      label: `Stripe ${pi.id.slice(-10)}`,
      line_items: items,
      shipping_method: Number(rate?.metadata.printify_shipping_method) || SHIPPING_METHOD.standard,
      address_to: {
        first_name: nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0],
        last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "-",
        email: session.customer_details?.email ?? "",
        phone: session.customer_details?.phone ?? undefined,
        country: address.country ?? "US",
        region: address.state,
        address1: address.line1,
        address2: address.line2 ?? undefined,
        city: address.city,
        zip: address.postal_code,
      },
    };

    if (!livemode && env.printifyTestOrders === "off") {
      console.info("[fulfillment] Test payment; Printify order not created:", JSON.stringify(order));
      await mark({ printify_status: "dry-run" });
      return;
    }

    const orderId = await createOrder(order);
    await mark({ printify_order_id: orderId, printify_status: "created" });
    if (!livemode) {
      await mark({ printify_order_id: orderId, printify_status: "draft" });
      return;
    }
    await sendToProduction(orderId);
    await mark({ printify_order_id: orderId, printify_status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await stripe.paymentIntents
      .update(pi.id, { metadata: { printify_error: message.slice(0, 480) } })
      .catch(() => {});
    throw err;
  }
}
