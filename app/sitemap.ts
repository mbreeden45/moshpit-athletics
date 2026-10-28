import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();

  const latest = products.reduce<string | undefined>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    undefined,
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: latest ? new Date(latest) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.slice(0, 4).map((i) => i.src),
    })),
  ];
}
