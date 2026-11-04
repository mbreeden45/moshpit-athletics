import type { ReactNode } from "react";

export type LegalSection = { heading: string; body: ReactNode };

/** Plain, single-column policy page in the site's quiet style. */
export function LegalPage({ title, updated, intro, sections }: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 py-16 leading-[1.5]">
      <header className="flex flex-col gap-1">
        <h1 className="font-bold">{title}</h1>
        <p className="text-muted">last updated {updated}</p>
      </header>
      <div className="flex flex-col gap-3">{intro}</div>
      {sections.map((s, i) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="font-bold">
            {i + 1}. {s.heading}
          </h2>
          <div className="flex flex-col gap-2 [&_ul]:list-['–_'] [&_ul]:pl-4">{s.body}</div>
        </section>
      ))}
    </article>
  );
}
