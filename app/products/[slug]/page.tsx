import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BlankSpecs } from "@/components/BlankSpecs";
import { JsonLd } from "@/components/JsonLd";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getCatalog, getCatalogProduct } from "@/lib/catalog";
import type { StorefrontProduct } from "@/lib/product";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const url = `/products/${product.slug}`;
  const title = product.blank ? `${product.title} — ${product.blank.name}` : product.title;
  const description = metaDescription(product);
  const images = product.images
    .slice(0, 4)
    .map((img) => ({ url: img.src, alt: `${product.title} — ${img.position.replace("_", " ")}` }));

  return {
    title,
    description,
    keywords: product.tags,
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
      "product:price:amount": (product.priceMin / 100).toFixed(2),
      "product:price:currency": product.currency,
    },
  };
}

function metaDescription(p: StorefrontProduct): string {
  const parts = [
    p.subtitle && (/[.!?]$/.test(p.subtitle) ? p.subtitle : `${p.subtitle}.`),
    p.blank ? `${p.blank.name}, ${p.blank.weight} ${p.blank.fabric.toLowerCase()}.` : null,
    p.colors.length > 1 ? `${p.colors.length} colorways.` : null,
    p.isGarment ? "Water-based pigment print, made to order in the USA." : "Made to order in the USA.",
  ].filter(Boolean);
  const text = parts.join(" ");
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, "") + "…" : text;
}

function productJsonLd(p: StorefrontProduct) {
  const url = `${SITE_URL}/products/${p.slug}`;
  const inStock = p.variants.some((v) => v.available);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.fullTitle,
    description: [p.subtitle, ...p.descriptionParagraphs].filter(Boolean).join(" ").slice(0, 5000) || p.title,
    url,
    sku: p.id,
    image: p.images.slice(0, 8).map((i) => i.src),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(p.blank ? { material: `${p.blank.weight} ${p.blank.fabric}` } : {}),
    ...(p.colors.length ? { color: p.colors.map((c) => c.name).join(", ") } : {}),
    ...(p.sizes.length ? { size: p.sizes.map((s) => s.name).join(", ") } : {}),
    offers: {
      "@type": "AggregateOffer",
      url,
      priceCurrency: p.currency,
      lowPrice: (p.priceMin / 100).toFixed(2),
      highPrice: (p.priceMax / 100).toFixed(2),
      offerCount: p.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

function breadcrumbJsonLd(p: StorefrontProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: p.title, item: `${SITE_URL}/products/${p.slug}` },
    ],
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  // Titles change in Printify; keep one canonical URL per product.
  if (slug !== product.slug) permanentRedirect(`/products/${product.slug}`);

  const { descriptionParagraphs, descriptionBullets, blank } = product;

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(product)} />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="eyebrow mb-8 text-muted">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/#shop" className="hover:text-paper">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-paper-dim">
              {product.title}
            </li>
          </ol>
        </nav>

        <ProductConfigurator product={product} />

        <div className="mt-20 grid gap-10 lg:grid-cols-2">
          {blank && <BlankSpecs blank={blank} />}
          {(descriptionParagraphs.length > 0 || descriptionBullets.length > 0) && (
            <section aria-labelledby="details-heading" className={blank ? "" : "lg:col-span-2"}>
              <h2 id="details-heading" className="eyebrow mb-4 text-paper-dim">
                Details
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-paper-dim">
                {descriptionParagraphs.slice(0, 6).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {descriptionBullets.length > 0 && (
                <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
                  {descriptionBullets.map((b, i) => (
                    <li key={i} className="py-2.5">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
