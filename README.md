# Mosh Pit Athletics — Storefront

Next.js (App Router) + Tailwind CSS storefront for **moshpitathletics.com**.
The catalog comes live from the Printify REST API. Shoppers build a bag on
this site and pay on Stripe-hosted Checkout; a Stripe webhook then places the
order with Printify, which prints and ships it.

## Setup

```bash
npm install
cp .env.example .env.local   # then add PRINTIFY_API_TOKEN
npm run discover-shop        # prints the Pop-Up shop id (or: npm run discover-shop -- --mock)
npm run dev
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `PRINTIFY_API_TOKEN` | server only | Printify personal access token |
| `PRINTIFY_SHOP_ID` | server only | Pop-Up shop id (`24807399`). If blank, it's found at runtime via `GET /v1/shops.json` (the `storefront` sales channel) |
| `NEXT_PUBLIC_POPUP_URL` | public | Pop-Up base URL (the Archive nav link and the Terms/Privacy footer links) |
| `STRIPE_SECRET_KEY` | server only | Stripe secret key (`sk_test_…` while testing, `sk_live_…` to sell) |
| `STRIPE_WEBHOOK_SECRET` | server only | Signing secret (`whsec_…`) of the Stripe webhook endpoint for `/api/stripe/webhook` |
| `PRINTIFY_WEBHOOK_SECRET` | server only | Shared secret for Printify's product webhooks (`/api/printify/webhook`); signs `X-Pfy-Signature` |
| `PRINTIFY_TEST_ORDERS` | server only | Test-mode payments only: `off` (default) logs the Printify order; `draft` creates it in Printify without sending it to print |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for the sitemap, canonical tags and OG cards |

On Vercel, add the same variables under Project → Settings → Environment Variables.
`vercel.json` pins the framework to Next.js, so the build works even if the
project's Framework Preset is left on "Other".
Never commit `.env.local`.

## How it works

- **`lib/printify.ts`**: API client. Covers `shops.json` discovery, paginated
  `products.json` and single `products/{id}.json`. Every request uses
  `next: { revalidate: 3600, tags: ["printify"] }`. Pages hold 10 products
  because full variant payloads go past Next's 2 MB data-cache entry limit at 50.
  A product shows on the site only if it is `visible` and published to the
  Pop-Up (it has `external.id`).
- **Instant updates**: Printify sends `product:updated`, `product:publish:started`
  and `product:deleted` webhooks to `/api/printify/webhook`, which verifies the
  signature and drops the cached catalog and pages, so price and product edits
  show on the next visit. The hourly refresh stays as a fallback. Register the
  webhooks with `POST /v1/shops/{shop_id}/webhooks.json` (`topic`, `url`,
  `secret`); leave the Pop-Up's own webhooks on the shop alone.
- **`lib/blanks.ts`**: garment specs keyed by `blueprint_id`.
  `706` is Comfort Colors 1717 and `1716` is Shaka Wear Max Heavyweight.
  Chest × length shows inline on the PDP size buttons.
- **`lib/specs.ts`**: garment specs written for this site, keyed by `blueprint_id`.
  They replace Printify's and the manufacturers' stock descriptions everywhere;
  only facts carry over, and named brands get a not-affiliated disclaimer.
  Add an entry when you start using a new blank (until then the panel reads
  "Printed to order in the USA.").
- **`lib/copy.ts`**: fixed brand copy: banner, fit, shipping/returns, and the Print
  (dark/light colorways plus the ink notice). Each color's swatch luminance
  picks which profile is highlighted.
- **`lib/product.ts`**: turns Printify payloads into a client-safe view model.
  Also builds slugs, the meta summary and the Pop-Up checkout URL
  (`{NEXT_PUBLIC_POPUP_URL}/product/{external.id}`).
- **`lib/designs.ts`**: merges one artwork printed on several blanks into a
  single design: one card, one page, and a Blank picker that swaps photos,
  colors, sizes, price and the Pop-Up link. Products merge automatically when
  their uploaded artwork matches exactly (reuse the upload from your Printify
  library rather than uploading it again). Printify tags override this:
  `group:<anything>` merges products that share the tag and keeps them apart
  from untagged ones, and `name:<Design Name>` sets the storefront name.
  The same can be set in code with the `DESIGN_GROUPS` map. Without a tag,
  names come from the `DESIGN_NAMES` map, then the product
  title. Shaka Wear leads, then Comfort Colors, then the rest. When a group mixes
  artwork (the Pasadena caps), the picker becomes a Style dropdown labelled from
  `STYLE_NAMES`, and each style's own description text (whatever isn't the
  blank's stock Printify copy) shows under the title and swaps with the pick.
- **SEO**: each PDP has `generateMetadata` (canonical URL, OG/Twitter
  cards, price meta) plus `Product` and `BreadcrumbList` JSON-LD. There's
  `app/sitemap.ts` (with image entries) and `app/robots.ts`, which blocks
  indexing on non-production Vercel deployments.

URLs look like `/products/the-ernie-tee`, with `?blank=american-apparel-1301`
for a non-lead blank. Old per-product URLs ending in a Printify id redirect
(308) to their design page with that blank selected.

## Design

The layout follows the Claude Design export "Mosh Pit Athletics v2":
Archivo (variable width, 62–80% stretch) for headlines and IBM Plex Mono at
13px for everything else. Colors are `#0A0A0A`, `#F5F5F3`, `#8A8A86` and
`#B5473F`, with 1px `#262626` rules. Design tokens live in `app/globals.css`.

- **Home**: hero, Collection grid (hover shows quick-buy size pills), then the
  newest tee as a featured product with its Garment Blueprint.
- **Product page**: gallery plus a sticky buy panel (color, size with inline
  chest × length, Print box, accordion), the Garment Blueprint table, and
  a fixed buy bar on mobile.

Terms and Privacy still link to the Pop-Up's pages, and Contact is a mailto
to support@moshpitathletics.com (set in `lib/site.ts`).

## Checkout

1. **Bag** (`components/CartProvider.tsx`, `lib/cart.ts`): lives in the
   browser's localStorage. Add to cart, Buy now and the catalog cards' size
   pills all add Printify product + variant ids to it.
2. **`POST /api/checkout`**: re-prices every line from the live Printify
   catalog (browser prices are display-only), quotes Printify shipping for the
   cart (`orders/shipping.json`; US rates are flat), rounds it up to the next
   dollar, and opens a Stripe Checkout Session: US shipping address, Standard
   and Express options, Stripe's dynamic payment methods (cards, Apple Pay,
   Google Pay, Link and others), and the all-sales-final note by the Pay
   button. Each line carries its Printify ids in product metadata.
3. **`POST /api/stripe/webhook`** (`checkout.session.completed` and
   `checkout.session.async_payment_succeeded`): verifies the signature, then
   `lib/fulfillment.ts` creates the Printify order (external id = Checkout
   Session id) and sends it to production. Progress and errors are written to
   the PaymentIntent's metadata (`printify_order_id`, `printify_status`,
   `printify_error`), so retries resume instead of double-ordering and failures
   show on the payment in the Stripe dashboard. Non-2xx responses make Stripe
   retry for up to three days.
4. **`/order/confirmed`**: reads the session, thanks the buyer and empties the bag.

Test-mode payments never reach print: by default the webhook only logs the
Printify order it would place (`printify_status: dry-run`); with
`PRINTIFY_TEST_ORDERS=draft` it creates the order in Printify but doesn't send
it to production. Live-mode payments always create and send.

Sales tax is not collected yet. To add it, enable Stripe Tax and pass
`automatic_tax: { enabled: true }` in `app/api/checkout/route.ts`.

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck`
- `npm run discover-shop`
