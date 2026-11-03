import Link from "next/link";
import type { Category } from "@/lib/categories";
import type { StorefrontDesign } from "@/lib/designs";
import { CategorySelect } from "./CategorySelect";
import { ProductCard } from "./ProductCard";

type Props = {
  /** Designs to show, newest first. */
  designs: StorefrontDesign[];
  categories: Category[];
  /** Slug of the open category, or "all". */
  active: string;
  /** Page heading. Visually hidden: the page is photos only, but search engines and screen readers get a title. */
  heading: string;
  /** Short summary for the same audience, matching the page's meta description. */
  summary: string;
  /** Newest designs overall, for the Dial-Up Edition's NEW! stickers. */
  dialupNewKeys?: Set<string>;
};

/** Days a design counts as new (the "new" tag on phones). */
const NEW_DAYS = 30;

function isRecent(design: StorefrontDesign, now: number): boolean {
  const created = Math.max(...design.products.map((p) => Date.parse(p.createdAt) || 0));
  return now - created < NEW_DAYS * 86_400_000;
}

/**
 * Desktop: category list on the left, a grid of photos on the right, no other text.
 * Phones: a category dropdown, then two-up cells with name and price.
 */
export function Catalog({ designs, categories, active, heading, summary, dialupNewKeys }: Props) {
  const nav = [{ slug: "all", label: "all", href: "/" }, ...categories.map((c) => ({ ...c, href: `/collections/${c.slug}` }))];
  const now = Date.now();

  return (
    <div id="collection" className="mx-auto w-full max-w-[1000px] md:flex md:items-start md:gap-6 md:px-4">
      <h1 className="sr-only">{heading}</h1>
      <p className="sr-only">{summary}</p>

      <div className="md:hidden">
        <CategorySelect options={nav.map(({ slug, label, href }) => ({ slug, label, href }))} active={active} />
      </div>

      <nav aria-label="Categories" className="shrink-0 max-md:hidden md:w-[110px]">
        <ul className="flex flex-col items-end text-right">
          {nav.map((c) => {
            const current = c.slug === active;
            return (
              <li key={c.slug}>
                <Link href={c.href} aria-current={current ? "page" : undefined} className={current ? "font-bold" : "link"}>
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {designs.length === 0 ? (
        <p className="flex-1 py-20 text-center text-muted">new designs soon.</p>
      ) : (
        <ul className="mpa-grid grid flex-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5 max-md:border-t max-md:border-faint">
          {designs.map((d, i) => (
            <ProductCard
              key={d.key}
              design={d}
              priority={i < 5}
              isNew={isRecent(d, now)}
              dialupNew={dialupNewKeys?.has(d.key)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
