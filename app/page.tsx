import { ProductCard } from "@/components/ProductCard";
import { PrintProfile } from "@/components/PrintProfile";
import { JsonLd } from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog";
import { COMFORT_COLORS_1717, SHAKA_WEAR_MAX_HEAVYWEIGHT } from "@/lib/blanks";
import { FIT_COPY, TOP_BANNER } from "@/lib/copy";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const products = await getCatalog();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} — All products`,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />

      <section className="grain relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-16 sm:px-6 md:grid-cols-[1fr_auto] md:items-end md:pt-24">
          <div>
            <p className="eyebrow text-signal">{TOP_BANNER}</p>
            <h1 className="display mt-5 text-[clamp(3.5rem,13vw,10.5rem)]">
              Mosh Pit
              <br />
              <span className="text-signal">Athletics</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-paper-dim sm:text-lg">
              Show shirts, replica tour tees and scene bootlegs — printed to order in small batches on
              heavyweight American blanks.
            </p>
          </div>
          <a
            href="#shop"
            className="display self-start border-2 border-paper px-8 py-4 text-2xl transition-colors hover:border-signal hover:bg-signal md:self-end"
          >
            Shop the drop ↓
          </a>
        </div>
      </section>

      <section id="shop" aria-labelledby="shop-heading" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 id="shop-heading" className="display text-4xl sm:text-5xl">
            All Products
          </h2>
          <p className="eyebrow text-muted">{products.length} pieces</p>
        </div>

        {products.length === 0 ? (
          <p className="border border-line px-6 py-16 text-center text-paper-dim">
            The next drop is being pressed. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </section>

      <section
        id="print-profile"
        aria-labelledby="craft-heading"
        className="mx-auto mt-24 grid max-w-7xl scroll-mt-24 gap-10 px-4 sm:px-6 lg:grid-cols-2"
      >
        <div>
          <h2 id="craft-heading" className="display text-4xl sm:text-5xl">
            How it&rsquo;s made
          </h2>
          <p className="mt-4 max-w-md text-paper-dim">{FIT_COPY}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {[COMFORT_COLORS_1717, SHAKA_WEAR_MAX_HEAVYWEIGHT].map((b) => (
              <li key={b.key} className="border border-line p-4">
                <p className="eyebrow text-signal">{b.weight}</p>
                <p className="display mt-2 text-2xl">{b.name}</p>
                <p className="mt-2 text-sm text-paper-dim">
                  {b.fabric}. {b.collar}. {b.cut}.
                </p>
              </li>
            ))}
          </ul>
        </div>
        <PrintProfile />
      </section>
    </>
  );
}
