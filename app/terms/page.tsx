import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of sale and use for ${SITE_NAME}: made-to-order apparel, all sales final, replacements for misprints.`,
  alternates: { canonical: "/terms" },
};

const mail = (
  <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
    {SUPPORT_EMAIL}
  </a>
);

export default function TermsPage() {
  return (
    <LegalPage
      title="terms"
      updated="November 4, 2026"
      intro={
        <>
          <p>
            These terms cover buying from and using moshpitathletics.com (the &ldquo;site&rdquo;), run by {SITE_NAME}{" "}
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a California business. By placing an order or using the site you agree
            to them. If you don&rsquo;t agree, please don&rsquo;t use the site.
          </p>
        </>
      }
      sections={[
        {
          heading: "Made to order",
          body: (
            <>
              <p>
                Every item is printed or embroidered after you order it and shipped by our production partners. Product
                photos are mockups: placement, scale and color can vary slightly from shirt to shirt and from screen to
                screen. Measurements on product pages are approximate.
              </p>
            </>
          ),
        },
        {
          heading: "Prices and payment",
          body: (
            <>
              <p>
                Prices are in US dollars. Shipping is shown at checkout before you pay. Payment is processed by Stripe; we
                never see or store your full card number.
              </p>
              <p>
                If an item is mispriced, unavailable or can&rsquo;t be produced, we may cancel that part of the order and
                refund what you paid for it in full.
              </p>
            </>
          ),
        },
        {
          heading: "Shipping",
          body: (
            <>
              <p>
                We ship to US addresses only. Orders usually ship within 3 to 7 business days, and you&rsquo;ll get
                tracking by email once your order leaves. Delivery dates from carriers are estimates, not guarantees.
              </p>
              <p>
                Please double-check your address at checkout. If a package comes back because of an incorrect or
                incomplete address, we can reship it once you cover the new shipping cost.
              </p>
            </>
          ),
        },
        {
          heading: "All sales final; misprints and damage",
          body: (
            <>
              <p>
                Because each item is made for you, we don&rsquo;t accept returns or exchanges, including for size or
                change of mind. Check the size guide on each product page before ordering.
              </p>
              <p>
                If something arrives misprinted, defective or damaged, or the wrong item arrives, email {mail} within 30
                days of delivery with your order email and photos. We&rsquo;ll send a replacement at no cost, or a refund
                if a replacement isn&rsquo;t possible. If tracking shows a package delivered but you can&rsquo;t find it,
                contact the carrier first, then us, and we&rsquo;ll help.
              </p>
            </>
          ),
        },
        {
          heading: "Designs and site content",
          body: (
            <>
              <p>
                The designs, text and images on this site belong to {SITE_NAME} or are used with permission. Buying a
                product gives you the product, not the right to reproduce or sell its design.
              </p>
              <p>
                Some designs reference bands, teams, players or events as fan tributes. Unless a product says otherwise,
                {` ${SITE_NAME}`} isn&rsquo;t affiliated with or endorsed by them, and brand names of garment makers only
                identify the blank we print on. If you believe something here infringes your rights, email {mail} and
                we&rsquo;ll review it promptly.
              </p>
            </>
          ),
        },
        {
          heading: "Using the site",
          body: (
            <p>
              Don&rsquo;t misuse the site: no attempts to break, overload or scrape it, no fraudulent orders, and nothing
              illegal. We may refuse or cancel orders we reasonably believe are fraudulent.
            </p>
          ),
        },
        {
          heading: "Warranties and liability",
          body: (
            <>
              <p>
                Beyond the misprint and damage promise above, the site and products are provided &ldquo;as is&rdquo; to
                the extent the law allows.
              </p>
              <p>
                To the extent the law allows, we aren&rsquo;t liable for indirect, incidental or consequential damages,
                and our total liability for any claim about an order is limited to what you paid for that order. Some
                places don&rsquo;t allow these limits, so they may not apply to you. Nothing here limits rights you have
                under California consumer law that can&rsquo;t be waived.
              </p>
            </>
          ),
        },
        {
          heading: "Disputes",
          body: (
            <p>
              If something goes wrong, email {mail} first; most problems are fixed quickly that way. These terms are
              governed by the laws of the State of California. Any dispute that can&rsquo;t be resolved informally will be
              handled in the state or federal courts located in California, except that either of us may bring a claim
              in small claims court where it qualifies.
            </p>
          ),
        },
        {
          heading: "Changes",
          body: (
            <p>
              We may update these terms; the date at the top shows the latest version. The terms in effect when you place
              an order apply to that order. See also our{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
          ),
        },
        { heading: "Contact", body: <p>Questions about these terms: {mail}</p> },
      ]}
    />
  );
}
