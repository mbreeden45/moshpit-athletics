import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} collects when you shop, who it's shared with, and your choices.`,
  alternates: { canonical: "/privacy" },
};

const mail = (
  <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
    {SUPPORT_EMAIL}
  </a>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      title="privacy"
      updated="November 4, 2026"
      intro={
        <p>
          This explains what {SITE_NAME} (&ldquo;we&rdquo;) collects when you visit moshpitathletics.com or place an
          order, why, and who it&rsquo;s shared with. Short version: we collect what it takes to make and ship your
          order, we don&rsquo;t sell your information, and the site has no ad trackers or analytics.
        </p>
      }
      sections={[
        {
          heading: "What we collect",
          body: (
            <ul>
              <li>
                <strong>When you order:</strong> your name, email, phone number, shipping address and what you bought.
                You enter these on Stripe&rsquo;s checkout page.
              </li>
              <li>
                <strong>Payment details:</strong> handled entirely by Stripe. We see the last four digits and card type,
                never your full card number.
              </li>
              <li>
                <strong>When you email us:</strong> whatever you send, so we can reply.
              </li>
              <li>
                <strong>When you browse:</strong> our host keeps standard server logs (IP address, browser type, pages
                requested) for security and troubleshooting.
              </li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>to take payment, make your order and ship it;</li>
              <li>to send receipts, tracking and replies about your order;</li>
              <li>to prevent fraud and keep the site running;</li>
              <li>to meet legal and tax obligations.</li>
            </ul>
          ),
        },
        {
          heading: "Who we share it with",
          body: (
            <>
              <p>Only the services that make the store work, each using it to do their part:</p>
              <ul>
                <li>
                  <strong>Stripe</strong> processes payments and may use your information to detect fraud.
                </li>
                <li>
                  <strong>Printify and its print partners</strong> receive your name, address, email and phone to
                  produce your order, ship it and send tracking.
                </li>
                <li>
                  <strong>Shipping carriers</strong> receive what&rsquo;s on the label.
                </li>
                <li>
                  <strong>Vercel</strong> hosts the site.
                </li>
              </ul>
              <p>
                We don&rsquo;t sell or rent your personal information, and we don&rsquo;t share it for advertising. We
                may disclose information if the law requires it.
              </p>
            </>
          ),
        },
        {
          heading: "Cookies and browser storage",
          body: (
            <>
              <p>
                This site doesn&rsquo;t use advertising or analytics cookies. It stores your bag in your own browser (local
                storage) so it&rsquo;s still there when you come back; clearing your browser data empties it. Stripe&rsquo;s
                checkout page sets its own cookies for payment security.
              </p>
              <p>
                The hidden &ldquo;1999&rdquo; mode remembers itself only until you close the tab. Its music player loads
                videos from YouTube (privacy-enhanced mode) only after you press play; YouTube&rsquo;s own policies
                apply from then on.
              </p>
            </>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              We keep order records as long as needed for the order, customer support and tax and accounting rules
              (typically up to seven years), then delete them.
            </p>
          ),
        },
        {
          heading: "Your choices and California rights",
          body: (
            <>
              <p>
                You can ask us what personal information we have about you, ask us to correct or delete it, and ask how
                it&rsquo;s used. California residents have these rights under the CCPA; we extend them to everyone. We
                won&rsquo;t treat you differently for using them. Email {mail}, and we&rsquo;ll respond within 45 days.
                Some records, like order history we&rsquo;re required to keep for taxes, may be retained.
              </p>
              <p>We don&rsquo;t send marketing email. Order emails go out only for orders you place.</p>
            </>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              The site runs over HTTPS, payments are handled by Stripe, and access to order data is limited to running
              the store. No system is perfectly secure, but we work to protect your information.
            </p>
          ),
        },
        {
          heading: "Children",
          body: <p>The site isn&rsquo;t directed to children under 13, and we don&rsquo;t knowingly collect their information.</p>,
        },
        {
          heading: "Changes and contact",
          body: (
            <p>
              We&rsquo;ll update this page if our practices change; the date at the top shows the latest version.
              Questions or requests: {mail}. See also our{" "}
              <Link href="/terms" className="underline underline-offset-2">
                terms
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
