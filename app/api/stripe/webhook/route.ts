import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { fulfillCheckoutSession } from "@/lib/fulfillment";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook — Stripe event endpoint.
 * Subscribe it to checkout.session.completed and
 * checkout.session.async_payment_succeeded. A non-2xx response makes Stripe
 * retry (for up to three days), and fulfillment resumes where it stopped.
 */
export async function POST(req: NextRequest) {
  if (!env.stripeWebhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      env.stripeWebhookSecret,
    );
  } catch (err) {
    console.warn("[webhook] Signature check failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await fulfillCheckoutSession(event.data.object.id, event.livemode);
    } catch (err) {
      console.error(`[webhook] Fulfillment failed for ${event.data.object.id}:`, err);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
