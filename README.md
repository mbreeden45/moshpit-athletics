# Mosh Pit Athletics — Storefront

Next.js (App Router) + Tailwind CSS storefront for **moshpitathletics.com**.
The catalog comes live from the Printify REST API. Checkout happens on the
Printify Pop-Up store, so this app has no Stripe, cart or order webhooks.

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
| `NEXT_PUBLIC_POPUP_URL` | public | Pop-Up base URL. Every Buy Now / Add to Cart button points here |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for the sitemap, canonical tags and OG cards |

On Vercel, add the same variables under Project → Settings → Environment Variables.
Never commit `.env.local`.

## How it works

- **`lib/printify.ts`**: API client. Covers `shops.json` discovery, paginated
  `products.json` and single `products/{id}.json`. Every request uses
  `next: { revalidate: 3600, tags: ["printify"] }`. Pages hold 10 products
  because full variant payloads go past Next's 2 MB data-cache entry limit at 50.
  A product shows on the site only if it is `visible` and published to the
  Pop-Up (it has `external.id`).
- **`lib/blanks.ts`**: garment specs keyed by `blueprint_id`.
  `706` is Comfort Colors 1717 and `1716` is Shaka Wear Max Heavyweight.
  Chest × length shows inline on the PDP size buttons.
- **`lib/copy.ts`**: fixed brand copy: banner, fit, shipping/returns, and the Print
  (dark/light colorways plus the ink notice). Each color's swatch luminance
  picks which profile is highlighted.
- **`lib/product.ts`**: turns Printify payloads into a client-safe view model.
  Also builds slugs, the meta summary and the Pop-Up checkout URL
  (`{NEXT_PUBLIC_POPUP_URL}/product/{external.id}`).
- **SEO**: each PDP has `generateMetadata` (canonical URL, OG/Twitter
  cards, price meta) plus `Product` and `BreadcrumbList` JSON-LD. There's
  `app/sitemap.ts` (with image entries) and `app/robots.ts`, which blocks
  indexing on non-production Vercel deployments.

URLs look like `/products/my-chemical-romance-bat-tee-68ed6fcded926f86860dfb32`.
The trailing Printify id resolves the product, and a stale title slug
redirects (308) to the canonical one.

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

Where the mockup shows things the Pop-Up flow doesn't support (Apple Pay
buttons, a live bag count, About/Contact pages), the site uses working
equivalents: "Buy now", a "Bag" link to the Pop-Up, links to the Pop-Up's
own Terms and Privacy pages, and a Contact mailto to
support@moshpitathletics.com (set in `lib/site.ts`).

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck`
- `npm run discover-shop`
