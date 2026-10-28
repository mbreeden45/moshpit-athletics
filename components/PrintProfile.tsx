import { PRINT_PROFILE } from "@/lib/copy";
import type { Tone } from "@/lib/product";

/**
 * Print Profile breakdown. When `activeTone` is set (PDP), the profile for the
 * selected colorway is highlighted; otherwise both are shown equally.
 */
export function PrintProfile({ activeTone }: { activeTone?: Tone }) {
  const tones: Tone[] = ["dark", "light"];
  return (
    <section aria-labelledby="print-profile-heading" className="border border-line">
      <h2 id="print-profile-heading" className="eyebrow border-b border-line px-4 py-3 text-paper-dim">
        Print Profile
      </h2>
      <dl className="divide-y divide-line">
        {tones.map((tone) => {
          const profile = PRINT_PROFILE[tone];
          const active = activeTone === undefined || activeTone === tone;
          return (
            <div
              key={tone}
              className={`grid gap-1 px-4 py-4 transition-opacity sm:grid-cols-[10rem_1fr] sm:gap-4 ${active ? "" : "opacity-40"}`}
            >
              <dt className="eyebrow flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-3 border border-paper/40 ${tone === "dark" ? "bg-ink" : "bg-paper"}`}
                />
                {profile.label}
                {activeTone === tone && <span className="sr-only">(selected colorway)</span>}
              </dt>
              <dd className="text-sm leading-relaxed text-paper-dim">{profile.body}</dd>
            </div>
          );
        })}
      </dl>
      <p className="eyebrow border-t border-line bg-ink-3 px-4 py-3 text-paper">{PRINT_PROFILE.notice}</p>
    </section>
  );
}
