import { Catalog } from "@/components/Catalog";
import { JsonLd } from "@/components/JsonLd";
import { getDesigns } from "@/lib/catalog";
import { getCategories } from "@/lib/categories";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const designs = await getDesigns();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — Shop all`,
    itemListElement: designs.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${d.slug}`,
      name: d.name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <Catalog
        designs={designs}
        categories={getCategories(designs)}
        active="all"
        heading={`${SITE_NAME}: graphic tees and apparel`}
        summary={SITE_DESCRIPTION}
        newKeys={new Set(designs.slice(0, 3).map((d) => d.key))}
      />
    </>
  );
}
