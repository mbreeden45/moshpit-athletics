import { formatInches, type BlankSpec } from "@/lib/blanks";

export function BlankSpecs({ blank }: { blank: BlankSpec }) {
  const rows: [string, string][] = [
    ["Blank", blank.name],
    ["Weight", blank.weight],
    ["Fabric", blank.fabric],
    ["Collar", blank.collar],
    ["Cut", blank.cut],
  ];
  const sizes = Object.entries(blank.measurements);

  return (
    <section aria-labelledby="blank-heading" className="border border-line">
      <h2 id="blank-heading" className="eyebrow border-b border-line px-4 py-3 text-paper-dim">
        Garment Blueprint
      </h2>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6rem_1fr] gap-4 px-4 py-2.5 text-sm">
            <dt className="eyebrow pt-0.5 text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full text-left font-mono text-xs">
          <caption className="sr-only">Flat measurements in inches</caption>
          <thead className="text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-normal">Size</th>
              <th scope="col" className="px-4 py-2 font-normal">Chest</th>
              <th scope="col" className="px-4 py-2 font-normal">Length</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map(([size, m]) => (
              <tr key={size} className="border-t border-line">
                <th scope="row" className="px-4 py-2 font-semibold">{size}</th>
                <td className="px-4 py-2">{formatInches(m.chest)}</td>
                <td className="px-4 py-2">{formatInches(m.length)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
