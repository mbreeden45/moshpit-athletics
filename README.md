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
  `STYLE_NAMES`.
- **Descriptions**: each product's own Printify description text (whatever
  isn't the blank's stock Printify copy) is the description on its page, and
  swaps with the Blank/Style pick. Lines after a "Details:" heading go into
  the collapsed details panel, along with the blank's spec summary. The first
  paragraph also leads the meta description and the JSON-LD description.
  Any sentence that names the blank (a garment brand, the blueprint's brand
  or its model number, e.g. "Comfort Colors 1717") is dropped from the
  description; the details panel lists the blank as "printed on: …" instead.
  Known brands are in `BLANK_BRANDS` in `lib/product.ts`.
  Products without their own text show the blank's spec summary instead.
- **SEO**: each PDP has `generateMetadata` (canonical URL, OG/Twitter
  cards, price meta) plus `Product` and `BreadcrumbList` JSON-LD. There's
  `app/sitemap.ts` (with image entries) and `app/robots.ts`, which blocks
  indexing on non-production Vercel deployments.

URLs look like `/products/the-ernie-tee`, with `?blank=american-apparel-1301`
for a non-lead blank. Old per-product URLs ending in a Printify id redirect
(308) to their design page with that blank selected.

## Design

Deliberately bare: a white page, black Courier text at 12px, and the product
photos. The only display type is the condensed Archivo wordmark. Tokens
(`bg`, `fg`, `muted`, `faint`, `accent`, `panel`) live in `app/globals.css`.

- **Shop** (`/` for everything, `/collections/<category>` per category).
  Desktop: category links on the left and a grid of photos, no names or
  prices. Phones follow Supreme's mobile shop: a grey top bar (back arrow,
  wordmark, bag), a category dropdown, and two-up bordered cells with the
  name and price ("sold out" when no variant is available) and a "new" tag
  for designs created in the last 30 days. Categories come from each
  product's kind in `lib/categories.ts`; `/collections/all` redirects to `/`.
- **Product page**. Desktop: photo with angle thumbnails on the left; name,
  color, description, color thumbnails, price, size dropdown, add to cart /
  keep shopping on the right. Phones: title, swipeable photos, size + add to cart,
  color and price on one line, swatches, description, fine print. Both end
  with collapsed details, sizing (measurement table), care, and shipping &
  returns. The footer is a black band of links on phones.
- **SEO without visible copy**: every page has its own title, meta
  description and canonical; tiles carry the product name as alt text; each
  shop page has a visually hidden `<h1>` and one-line summary that match its
  meta description; JSON-LD covers the Organization, the ItemList /
  CollectionPage, breadcrumbs (Shop › Category › Product) and the
  ProductGroup with per-variant offers. Collapsed product-page sections are in
  the HTML, so they're indexed. Category pages are in the sitemap.

Terms and Privacy still link to the Pop-Up's pages, and Contact is a mailto
to support@moshpitathletics.com (set in `lib/site.ts`).

## Checkout

1. **Bag** (`components/CartProvider.tsx`, `lib/cart.ts`): lives in the
   browser's localStorage. Add to cart puts the Printify product + variant
   ids in it; the bag's "checkout now" starts Stripe Checkout.
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

## Dial-Up Edition

An opt-in 1999 Angelfire skin over the whole site, reached from the small
"1999" footer link
(`/?dialup`, remembered per browser; `/?2026` or "Back to 2026" exits).

- `ERA_SCRIPT` (in `<head>`) sets `<html data-era="dialup">` before paint.
- `app/dialup.css` re-points the design tokens and restyles everything under
  that attribute; the normal site only sees `.dialup-only { display: none }`.
- `components/dialup/DialUpChrome.tsx`: banner, sidebar (pill nav, visitor
  counter frozen at 420, under-construction sign), marquee.
- `components/dialup/DialUpFx.tsx`: Mosh Pit Radio (a Winamp-style player that
  embeds official music videos from the artists' own YouTube channels, only
  after ▶ is pressed) and the sparkle cursor.
- `lib/dialup.ts`: playlist and `BANNER_PHOTO` (null shows the newest design's
  mockup; set it to a photo you own or have licensed).

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck`
- `npm run discover-shop`
