import { formatInches, type BlankSpec } from "@/lib/blanks";
import { BRAND_DISCLAIMER } from "@/lib/specs";

export function GarmentBlueprint({ blank, id }: { blank: BlankSpec; id?: string }) {
  const cells: [string, string][] = [
    ["Blank / Model", blank.name],
    ["Weight", blank.weight],
    ["Collar", blank.collar],
    ["Cut", blank.cut],
  ];
  const rows = Object.entries(blank.measurements);

  return (
    <section id={id} aria-labelledby="blueprint-heading" className="scroll-mt-20 border-t border-line px-4 pb-24 pt-12 sm:px-8">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4 uppercase">
        <h2 id="blueprint-heading" className="headline text-[44px]">
          Garment Blueprint
        </h2>
        <span className="text-muted">{blank.name}</span>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px border border-paper bg-paper">
        {cells.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-7 bg-ink p-6">
            <dt className="label">{k}</dt>
            <dd className="headline text-[30px] leading-none">{v}</dd>
          </div>
        ))}
      </dl>

      <table className="mt-8 w-full border border-paper text-left">
        <caption className="sr-only">Flat garment measurements in inches</caption>
        <thead>
          <tr className="label">
            <th scope="col" className="px-5 py-3.5 font-normal">Size</th>
            <th scope="col" className="px-5 py-3.5 font-normal">Chest width</th>
            <th scope="col" className="px-5 py-3.5 font-normal">Length</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([size, m]) => (
            <tr key={size} className="border-t border-line">
              <th scope="row" className="w-1/3 px-5 py-3.5 font-normal">{size}</th>
              <td className="w-1/3 px-5 py-3.5">{formatInches(m.chest)}</td>
              <td className="w-1/3 px-5 py-3.5">{formatInches(m.length)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="label mt-4 normal-case tracking-normal">{BRAND_DISCLAIMER}</p>
    </section>
  );
}
