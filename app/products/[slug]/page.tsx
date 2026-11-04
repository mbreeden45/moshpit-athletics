import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getDesignBySlug, getDesigns } from "@/lib/catalog";
import { primaryCategory } from "@/lib/categories";
import { PRINT_METHOD_COPY } from "@/lib/copy";
import type { StorefrontDesign } from "@/lib/designs";
import { storySections } from "@/lib/product";
import { quoteForProduct } from "@/lib/shipping";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const designs = await getDesigns();
  return designs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getDesignBySlug(slug);
  if (!found?.design) return { title: "Product not found", robots: { index: false } };

  const { design } = found;
  const product = design.products[0];
  const url = `/products/${design.slug}`;
  const title = design.name;
  const description = metaDescription(design);
  const images = product.images
    .slice(0, 4)
    .map((img) => ({ url: img.src, alt: `${design.name} — ${img.position.replace("_", " ")}` }));

  return {
    title,
    description,
    keywords: [...new Set(design.products.flatMap((p) => p.tags))],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    other: {
      "product:price:amount": (design.priceMin / 100).toFixed(2),
      "product:price:currency": product.currency,
    },
  };
}

function metaDescription(d: StorefrontDesign): string {
  const p = d.products[0];
  // The seller's own first paragraph says what the design is; it leads when there is one.
  const lead = storySections(p.story).about[0];
  const parts = [
    lead,
    p.subtitle && (/[.!?]$/.test(p.subtitle) ? p.subtitle : `${p.subtitle}.`),
    p.blank ? `${p.blank.name}, ${p.blank.weight} ${p.blank.fabric.toLowerCase()}.` : null,
    d.products.length > 1 ? `Available in ${d.products.length} ${d.picker === "Style" ? "styles" : "blanks"}.` : null,
    p.colors.length > 1 ? `${p.colors.length} colorways.` : null,
    ...p.printMethods.map((m) => PRINT_METHOD_COPY[m]),
    "Made to order in the USA.",
  ].filter(Boolean);
  const text = parts.join(" ");
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, "") + "…" : text;
}

const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
};

/** Shipping as charged at checkout: US only, ships in 3–7 business days. */
function shippingDetails(cents: number, label: string, transit: [number, number]) {
  return {
    "@type": "OfferShippingDetails",
    shippingLabel: label,
    shippingRate: { "@type": "MonetaryAmount", value: (cents / 100).toFixed(2), currency: "USD" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: transit[0], maxValue: transit[1], unitCode: "DAY" },
    },
  };
}

/**
 * ProductGroup with one Product per variant (blank × color × size), each with
 * a real Offer: price, availability, shipping and the no-returns policy, which
 * is what Google's merchant listings need.
 */
async function productJsonLd(d: StorefrontDesign) {
  const lead = d.products[0];
  const url = `${SITE_URL}/products/${d.slug}`;
  const quotes = await Promise.all(
    d.products.map((p) => {
      const v = p.variants.find((x) => x.available) ?? p.variants[0];
      return v ? quoteForProduct(p.id, v.id) : Promise.resolve(null);
    }),
  );

  const hasVariant = d.products.flatMap((p, i) => {
    const pageUrl = i === 0 ? url : `${url}?blank=${p.blankKey}`;
    const quote = quotes[i];
    // Cheapest option only; Express is offered at checkout.
    const shipping = quote?.standard !== undefined ? shippingDetails(quote.standard, "Standard", [2, 5]) : null;
    return p.variants.map((v) => {
      const color = p.colors.find((c) => c.id === v.colorId)?.name;
      const size = p.sizes.find((s) => s.id === v.sizeId)?.name;
      const image = p.images.find((img) => img.variantIds.includes(v.id))?.src ?? p.defaultImage;
      return {
        "@type": "Product",
        sku: `${p.id}-${v.id}`,
        name: [d.name, d.products.length > 1 ? d.optionLabels[i] : null, [color, size].filter(Boolean).join(" / ")]
          .filter(Boolean)
          .join(" – "),
        ...(image ? { image } : {}),
        ...(color ? { color } : {}),
        ...(size ? { size } : {}),
        offers: {
          "@type": "Offer",
          url: pageUrl,
          price: (v.price / 100).toFixed(2),
          priceCurrency: p.currency,
          availability: v.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          ...(shipping ? { shippingDetails: shipping } : {}),
          // Also declared store-wide on the Organization; kept here because Google reads offers first.
          hasMerchantReturnPolicy: RETURN_POLICY,
        },
      };
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${url}#product`,
    name: d.name,
    description: [...storySections(lead.story).about, lead.subtitle, lead.spec?.summary].filter(Boolean).join(" ") || d.name,
    url,
    productGroupID: d.slug,
    image: lead.images.slice(0, 8).map((i) => i.src),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: lead.kind.many,
    variesBy: [
      ...(d.products.some((p) => p.colors.length > 1) ? ["https://schema.org/color"] : []),
      ...(d.products.some((p) => p.sizes.length > 1) ? ["https://schema.org/size"] : []),
      ...(d.products.length > 1 ? ["https://schema.org/material"] : []),
    ],
    hasVariant,
  };
}

function breadcrumbJsonLd(d: StorefrontDesign) {
  const category = primaryCategory(d);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: category.title, item: `${SITE_URL}/collections/${category.slug}` },
      { "@type": "ListItem", position: 3, name: d.name, item: `${SITE_URL}/products/${d.slug}` },
    ],
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getDesignBySlug(slug);
  if (!found) notFound();

  // Old per-product URLs move to their design page.
  if (!found.design) permanentRedirect(found.redirectTo);
  const { design } = found;

  return (
    <>
      <JsonLd data={await productJsonLd(design)} />
      <JsonLd data={breadcrumbJsonLd(design)} />
      <ProductConfigurator design={design} />
    </>
  );
}
