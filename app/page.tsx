import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getDesigns } from "@/lib/catalog";
import { HERO, TOP_BANNER } from "@/lib/copy";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const designs = await getDesigns();
  // Newest tee on a spec'd blank leads the "Latest" feature; else newest design.
  const featured = designs.find((d) => d.products[0].blank) ?? designs[0] ?? null;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — Collection`,
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

      <section className="mpa-hero border-b border-line px-4 pb-10 pt-24 sm:px-8">
        <p className="mb-8 uppercase text-muted">{TOP_BANNER}</p>
        <h1 className="headline-xl text-[clamp(64px,15vw,250px)]">
          {HERO.headline}
          <br />
          <span className="text-muted">{HERO.subhead}</span>
        </h1>
        <div className="mt-16 flex flex-wrap items-end justify-between gap-10">
          <p className="max-w-[460px] text-[15px] leading-[1.6] tracking-normal text-body">{HERO.body}</p>
          <a
            href="#collection"
            className="border border-paper bg-paper px-9 py-5 font-medium uppercase text-ink hover:bg-ink hover:text-paper"
          >
            {HERO.cta}
          </a>
        </div>
      </section>

      <section id="collection" aria-labelledby="collection-heading" className="scroll-mt-20 px-4 pb-24 pt-12 sm:px-8">
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4 uppercase">
          <h2 id="collection-heading" className="headline text-[44px]">
            Collection
          </h2>
          <span className="text-muted">{designs.length} items</span>
        </div>

        {designs.length === 0 ? (
          <p className="border border-line px-6 py-16 text-center uppercase text-muted">
            New designs are on press. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-px border border-line bg-line">
            {designs.map((d, i) => (
              <ProductCard key={d.key} design={d} priority={i < 4} isNew={i < 3} />
            ))}
          </div>
        )}
      </section>

      {featured && (
        <div id="featured" className="scroll-mt-16">
          <ProductConfigurator design={featured} as="h2" blueprintId="blueprint" />
        </div>
      )}
    </>
  );
}
