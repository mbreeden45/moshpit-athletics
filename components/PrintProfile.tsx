import { PRINT_PROFILE } from "@/lib/copy";
import type { Tone } from "@/lib/product";

/**
 * Print breakdown box. On a PDP, `activeTone` marks the profile that applies
 * to the selected colorway.
 */
export function PrintProfile({ activeTone }: { activeTone?: Tone }) {
  const tones: Tone[] = ["dark", "light"];
  return (
    <section aria-labelledby="print-profile-heading" className="flex flex-col gap-[18px] border border-paper p-5">
      <h2 id="print-profile-heading" className="headline text-[28px] leading-none">
        {PRINT_PROFILE.heading}
      </h2>
      {tones.map((tone, i) => {
        const profile = PRINT_PROFILE[tone];
        const active = activeTone === tone;
        return (
          <div key={tone} className={`flex flex-col gap-1.5 ${i > 0 ? "border-t border-line pt-4" : ""}`}>
            <h3 className={`label flex gap-2 ${active ? "text-paper" : ""}`}>
              {profile.label}
              {active && <span className="text-rust">/ Selected</span>}
            </h3>
            <p className="prose-body">{profile.body}</p>
          </div>
        );
      })}
      <p className="border-t border-line pt-3 text-[12px] uppercase leading-[1.6]">{PRINT_PROFILE.notice}</p>
    </section>
  );
}
