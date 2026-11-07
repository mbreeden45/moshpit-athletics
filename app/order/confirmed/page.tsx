import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { GoogleReviewsOptIn } from "@/components/GoogleReviewsOptIn";
import { formatPrice } from "@/lib/product";
import { GOOGLE_MERCHANT_ID, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

/** Latest delivery we promise: 3–7 business days to ship plus 2–5 in transit. */
function estimatedDelivery(from: Date, businessDays = 12): string {
  const d = new Date(from);
  let left = businessDays;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const session =
    sessionId && /^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)
      ? await getStripe()
          .checkout.sessions.retrieve(sessionId)
          .catch(() => null)
      : null;
  const paid = session?.status === "complete";

  return (
    <section className="mx-auto flex max-w-[460px] flex-col gap-3 px-4 py-20 leading-[1.35]">
      {paid && <ClearCart />}
      {/* Real (live-mode) orders only, so test purchases never reach Google's survey. */}
      {paid && session.livemode && session.customer_details?.email && (
        <GoogleReviewsOptIn
          merchantId={GOOGLE_MERCHANT_ID}
          orderId={session.id}
          email={session.customer_details.email}
          estimatedDeliveryDate={estimatedDelivery(new Date(session.created * 1000))}
        />
      )}
      <h1 className="font-bold">{paid ? "order confirmed. on press." : "order not found."}</h1>
      {paid ? (
        <>
          <p>
            Thanks. Your payment of {formatPrice(session.amount_total ?? 0, true)} went through, and your order is
            headed to print. A receipt is on its way to {session.customer_details?.email ?? "your inbox"}.
          </p>
          <p>
            Orders ship in 3 to 7 business days, and you&apos;ll get tracking by email once it leaves. Questions?{" "}
            <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </>
      ) : (
        <p>
          We couldn&apos;t find a completed order for this link. If you were charged, email{" "}
          <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      )}
      <Link href="/" className="mt-4 underline underline-offset-2">
        back to shop
      </Link>
    </section>
  );
}
