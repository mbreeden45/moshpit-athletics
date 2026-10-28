/**
 * Brand copy. Wording here is fixed — edit deliberately.
 * House rule: no gym clichés, fitness slogans, barbells or workouts.
 */

export const TOP_BANNER = "Drop 07 / Small-batch USA production";

export const HERO = {
  headline: "Heavyweight graphics.",
  subhead: "Zero gimmicks.",
  body: "Heavyweight cotton, boxy silhouettes, and screen-print culture. Cut and printed in small runs, then gone.",
  cta: "Shop latest drop",
};

export const FIT_COPY =
  "Boxy, relaxed drop. Stick true to size for standard room, or size down for a classic, closer cut.";

export const PRINT_PROFILE = {
  heading: "Print",
  dark: {
    label: "Dark Colorways",
    body: "Bold, opaque pigment strike on a solid base. Heavy hand-feel that won't peel or crack. Breaks in and softens naturally with wash and wear.",
  },
  light: {
    label: "Light Colorways",
    body: "Soft-hand print where pigment binds directly into the cotton knit for high breathability.",
  },
  notice: "Water-based pigment print. No plastic heat-press film.",
} as const;

export const CARE_COPY =
  "Machine wash cold inside-out with like colors. Hang dry or tumble low. Dark colorways are pre-treated to lock in white ink vibrancy; any initial wash scent or crispness clears after the first rinse.";

/** Rendered as `lead` + mailto link (`linkText`) + `tail`. */
export const SHIPPING_RETURNS = {
  lead: "Orders ship in 3 to 7 business days. Because items are produced specifically for each order, all sales are final. If an item arrives misprinted or damaged, ",
  linkText: "contact us at support@moshpitathletics.com",
  tail: " with photos for an immediate replacement.",
} as const;

export const CHECKOUT_NOTE =
  "Checkout, taxes and shipping are handled on our Printify Pop-Up store. Confirm color and size on the next page.";
