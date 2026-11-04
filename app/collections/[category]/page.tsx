import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog } from "@/components/Catalog";
import { JsonLd } from "@/components/JsonLd";
import { getDesigns } from "@/lib/catalog";
import { getCategories, type Category } from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string }> };

async function findCategory(slug: string) {
  const categories = getCategories(await getDesigns());
  return { categories, category: categories.find((c) => c.slug === slug) ?? null };
}

export async function generateStaticParams() {
  return getCategories(await getDesigns()).map((c) => ({ category: c.slug }));
}

function description(c: Category): string {
  const names = c.designs.slice(0, 4).map((d) => d.name);
  return `${c.title} from ${SITE_NAME}, printed to order in the USA. ${names.join(", ")}${
    c.designs.length > names.length ? " and more" : ""
  }.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await findCategory((await params).category);
  if (!category) return { title: "Not found", robots: { index: false } };
  const url = `/collections/${category.slug}`;
  const image = category.designs[0]?.products[0].defaultImage;
  return {
    title: category.title,
    description: description(category),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: `${category.title} | ${SITE_NAME}`,
      description: description(category),
      ...(image ? { images: [{ url: image, alt: category.designs[0].name }] } : {}),
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categories, category } = await findCategory((await params).category);
  if (!category) notFound();

  const url = `${SITE_URL}/collections/${category.slug}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.title} | ${SITE_NAME}`,
      url,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: category.designs.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/products/${d.slug}`,
          name: d.name,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: category.title, item: url },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={ld} />
      <Catalog
        designs={category.designs}
        categories={categories}
        active={category.slug}
        heading={`${category.title} — ${SITE_NAME}`}
        summary={description(category)}
      />
    </>
  );
}
