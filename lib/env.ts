import "server-only";

/**
 * Server-side environment. PRINTIFY_API_TOKEN must never reach the client,
 * which is why this module imports "server-only".
 */
export const env = {
  printifyToken: process.env.PRINTIFY_API_TOKEN?.trim() || "",
  printifyShopId: process.env.PRINTIFY_SHOP_ID?.trim() || "",
  printifyWebhookSecret: process.env.PRINTIFY_WEBHOOK_SECRET?.trim() || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || "",
  /**
   * What a paid Stripe test-mode checkout does in Printify: "off" (log only,
   * the default) or "draft" (create the order but never send it to print).
   * Live-mode payments always create the order and send it to production.
   */
  printifyTestOrders: process.env.PRINTIFY_TEST_ORDERS?.trim() === "draft" ? "draft" : "off",
};

export function hasPrintifyToken(): boolean {
  return env.printifyToken.length > 0;
}
