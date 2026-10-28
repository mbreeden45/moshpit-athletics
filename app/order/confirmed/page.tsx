import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { formatPrice } from "@/lib/product";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

type Props = { searchParams: Promise<{ session_id?: string }> };

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
    <section className="px-4 pb-24 pt-24 sm:px-8">
      {paid && <ClearCart />}
      <p className="mb-8 uppercase text-rust">{paid ? "Order confirmed" : "Order status"}</p>
      <h1 className="headline-xl text-[clamp(56px,10vw,150px)]">{paid ? "On press." : "Not found."}</h1>
      <div className="prose-body mt-12 flex max-w-[560px] flex-col gap-4 text-body">
        {paid ? (
          <>
            <p>
              Thanks. Your payment of {formatPrice(session.amount_total ?? 0, true)} went through, and your order is
              headed to print. A receipt is on its way to {session.customer_details?.email ?? "your inbox"}.
            </p>
            <p>
              Orders ship in 3 to 7 business days, and you&apos;ll get tracking by email once it leaves. Questions?{" "}
              <a href={SUPPORT_MAILTO} className="text-paper underline underline-offset-2 hover:text-rust">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </>
        ) : (
          <p>
            We couldn&apos;t find a completed order for this link. If you were charged, email{" "}
            <a href={SUPPORT_MAILTO} className="text-paper underline underline-offset-2 hover:text-rust">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        )}
      </div>
      <Link
        href="/#collection"
        className="mt-12 inline-block border border-paper px-9 py-5 font-medium uppercase hover:bg-paper hover:text-ink"
      >
        Back to the collection
      </Link>
    </section>
  );
}
