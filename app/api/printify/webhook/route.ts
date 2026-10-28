import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * POST /api/printify/webhook — Printify product events.
 *
 * Subscribed (per shop) to product:updated, product:publish:started and
 * product:deleted. Any of them drops the cached Printify catalog and the
 * pages built from it, so price and product edits show up on the next
 * visit instead of at the hourly refresh. Requests are signed with
 * PRINTIFY_WEBHOOK_SECRET: X-Pfy-Signature = "sha256=" + HMAC-SHA256(body).
 */

const PRODUCT_TOPICS = new Set(["product:updated", "product:publish:started", "product:deleted", "product:created"]);

function validSignature(body: string, header: string | null): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", env.printifyWebhookSecret).update(body).digest("hex"));
  const given = Buffer.from(header.slice("sha256=".length));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: NextRequest) {
  if (!env.printifyWebhookSecret) {
    console.error("[printify-webhook] PRINTIFY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  if (!validSignature(body, req.headers.get("x-pfy-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; resource?: { id?: string; data?: { shop_id?: number } } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Other shops on the account (Etsy, TikTok…) don't feed this site.
  const shopId = event.resource?.data?.shop_id;
  const ours = !env.printifyShopId || shopId === undefined || String(shopId) === env.printifyShopId;

  if (ours && event.type && PRODUCT_TOPICS.has(event.type)) {
    revalidateTag("printify", { expire: 0 });
    revalidatePath("/", "layout");
    console.info(`[printify-webhook] ${event.type} ${event.resource?.id ?? ""}: catalog refreshed`);
  }

  return NextResponse.json({ received: true });
}
