import type { MetadataRoute } from "next";
import { getDesigns } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const designs = await getDesigns();

  const latest = designs.reduce<string | undefined>(
    (max, d) => (!max || d.updatedAt > max ? d.updatedAt : max),
    undefined,
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: latest ? new Date(latest) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...designs.map((d) => ({
      url: `${SITE_URL}/products/${d.slug}`,
      lastModified: new Date(d.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: d.products[0].images.slice(0, 4).map((i) => i.src),
    })),
  ];
}
