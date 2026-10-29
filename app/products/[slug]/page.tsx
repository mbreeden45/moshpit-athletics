import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getDesignBySlug, getDesigns } from "@/lib/catalog";
import { PRINT_METHOD_COPY } from "@/lib/copy";
import type { StorefrontDesign } from "@/lib/designs";
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
  const parts = [
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

function productJsonLd(d: StorefrontDesign) {
  const p = d.products[0];
  const url = `${SITE_URL}/products/${d.slug}`;
  const variants = d.products.flatMap((b) => b.variants);
  const inStock = variants.some((v) => v.available);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: d.name,
    description: [p.subtitle, p.spec?.summary].filter(Boolean).join(" ") || d.name,
    url,
    sku: p.id,
    image: p.images.slice(0, 8).map((i) => i.src),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: p.kind.many,
    ...(p.blank ? { material: `${p.blank.weight} ${p.blank.fabric}` } : {}),
    ...(p.colors.length ? { color: p.colors.map((c) => c.name).join(", ") } : {}),
    ...(p.sizes.length ? { size: p.sizes.map((s) => s.name).join(", ") } : {}),
    offers: {
      "@type": "AggregateOffer",
      url,
      priceCurrency: p.currency,
      lowPrice: (d.priceMin / 100).toFixed(2),
      highPrice: (d.priceMax / 100).toFixed(2),
      offerCount: variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME },
    },
  };
}

function breadcrumbJsonLd(d: StorefrontDesign) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: d.name, item: `${SITE_URL}/products/${d.slug}` },
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
    <div className="pb-16 md:pb-0">
      <JsonLd data={productJsonLd(design)} />
      <JsonLd data={breadcrumbJsonLd(design)} />
      <ProductConfigurator design={design} stickyBar />
    </div>
  );
}
