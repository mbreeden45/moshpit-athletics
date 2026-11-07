import { getDesigns } from "@/lib/catalog";
import type { StorefrontDesign } from "@/lib/designs";
import { storyForDisplay, storySections, type StorefrontProduct } from "@/lib/product";
import { publicImageUrl } from "@/lib/media";
import { quoteForProduct } from "@/lib/shipping";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * GET /google-feed.xml: Google Merchant Center product feed (RSS 2.0 with
 * the g: namespace). One item per size/color variant; ids match the sku in
 * the product pages' structured data. Shipping is each product's Standard
 * rate exactly as charged at checkout, so it overrides the account default.
 * Add it in Merchant Center under Products → Add products → Add a product
 * source → "Add products from a file" → "Enter a link to your file".
 */

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const tag = (name: string, value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "" : `<${name}>${esc(String(value))}</${name}>`;

/** Google's product taxonomy, by our product kind. */
function googleCategory(p: StorefrontProduct): string {
  switch (p.kind.one) {
    case "Cap":
      return "Apparel & Accessories > Clothing Accessories > Hats";
    case "Print":
      return "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork";
    case "Pet Goods":
      return "Animals & Pet Supplies > Pet Supplies";
    default:
      return "Apparel & Accessories > Clothing > Shirts & Tops";
  }
}

/** Clothing and hats: Google requires age group and gender for these in the US. */
const isApparel = (p: StorefrontProduct) => p.isGarment || p.kind.one === "Cap";

async function items(d: StorefrontDesign): Promise<string[]> {
  const description = [
    d.searchLine,
    d.intro,
    ...storyForDisplay(storySections(d.products[0].story).about),
    d.products[0].spec?.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 4900);

  const out: string[] = [];
  for (const [i, p] of d.products.entries()) {
    const firstAvailable = p.variants.find((v) => v.available) ?? p.variants[0];
    const quote = firstAvailable ? await quoteForProduct(p.id, firstAvailable.id) : null;
    const link = `${SITE_URL}/products/${d.slug}${i === 0 ? "" : `?blank=${p.blankKey}`}`;
    const womens = /women/i.test(p.blankLabel);

    for (const v of p.variants) {
      const color = p.colors.find((c) => c.id === v.colorId)?.name;
      const size = p.sizes.find((s) => s.id === v.sizeId)?.name;
      const images = [
        ...p.images.filter((img) => img.variantIds.includes(v.id)).map((img) => img.src),
        p.defaultImage,
      ]
        .filter((src, k, all): src is string => Boolean(src) && all.indexOf(src) === k)
        .map(publicImageUrl);
      const title = [d.fullName, d.products.length > 1 ? d.optionLabels[i] : null, [color, size].filter(Boolean).join(" / ")]
        .filter(Boolean)
        .join(" – ")
        .slice(0, 150);

      out.push(
        [
          "<item>",
          tag("g:id", `${p.id}-${v.id}`),
          tag("g:item_group_id", d.slug),
          tag("title", title),
          tag("description", description || d.fullName),
          tag("link", link),
          tag("g:image_link", images[0]),
          ...images.slice(1, 10).map((src) => tag("g:additional_image_link", src)),
          tag("g:availability", v.available ? "in_stock" : "out_of_stock"),
          tag("g:price", `${(v.price / 100).toFixed(2)} USD`),
          tag("g:condition", "new"),
          tag("g:brand", SITE_NAME),
          tag("g:identifier_exists", "no"),
          tag("g:google_product_category", googleCategory(p)),
          tag("g:product_type", p.kind.many),
          tag("g:color", color),
          tag("g:size", size),
          ...(isApparel(p)
            ? [tag("g:age_group", "adult"), tag("g:gender", womens ? "female" : "unisex"), tag("g:size_system", "US")]
            : []),
          quote?.standard !== undefined
            ? `<g:shipping>${tag("g:country", "US")}${tag("g:service", "Standard")}${tag("g:price", `${(quote.standard / 100).toFixed(2)} USD`)}</g:shipping>`
            : "",
          tag("g:min_handling_time", 3),
          tag("g:max_handling_time", 7),
          "</item>",
        ].join(""),
      );
    }
  }
  return out;
}

export async function GET() {
  const designs = await getDesigns();
  const all = (await Promise.all(designs.map(items))).flat();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE_NAME)}</title>
<link>${esc(SITE_URL)}</link>
<description>${esc(`${SITE_NAME} products`)}</description>
${all.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
