import "server-only";
import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

/** Server-side Stripe client; throws if STRIPE_SECRET_KEY is missing. */
export function getStripe(): Stripe {
  if (!env.stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(env.stripeSecretKey, { appInfo: { name: "MoshPitAthletics-Storefront" } });
  return client;
}
