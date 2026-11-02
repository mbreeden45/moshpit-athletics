import Link from "next/link";
import type { Category } from "@/lib/categories";
import type { StorefrontDesign } from "@/lib/designs";
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
  newKeys?: Set<string>;
};

/** Category list on the left, a grid of product photos on the right. No other text. */
export function Catalog({ designs, categories, active, heading, summary, newKeys }: Props) {
  const nav = [{ slug: "all", label: "all", href: "/" }, ...categories.map((c) => ({ ...c, href: `/collections/${c.slug}` }))];

  return (
    <div id="collection" className="mx-auto w-full max-w-[1000px] px-4 md:flex md:items-start md:gap-6">
      <h1 className="sr-only">{heading}</h1>
      <p className="sr-only">{summary}</p>

      <nav aria-label="Categories" className="mb-6 shrink-0 md:mb-0 md:w-[110px]">
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 md:flex-col md:items-end md:gap-0 md:text-right">
          {nav.map((c) => {
            const current = c.slug === active;
            return (
              <li key={c.slug}>
                <Link
                  href={c.href}
                  aria-current={current ? "page" : undefined}
                  className={current ? "font-bold" : "link"}
                >
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
        <ul className="mpa-grid grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {designs.map((d, i) => (
            <ProductCard key={d.key} design={d} priority={i < 5} isNew={newKeys?.has(d.key)} />
          ))}
        </ul>
      )}
    </div>
  );
}
