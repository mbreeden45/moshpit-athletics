/**
 * Brand copy. Wording here is fixed — edit deliberately.
 * House rule: no gym clichés, fitness slogans, barbells or workouts.
 */

export const FIT_COPY =
  "Boxy, relaxed drop. Stick true to size for standard room, or size down for a classic, closer cut.";

/** Shown on garments printed DTG (product page "details"). Plain description first; the acronym only in the note. */
export const PRINT_PROFILE = {
  dark: {
    label: "Dark Colorways",
    body: "The shirt is pre-treated and gets a thin white base first, so colors stay bright on dark fabric. You'll feel the print a little more than on light shirts, and it softens with washing.",
  },
  light: {
    label: "Light Colorways",
    body: "Ink is printed straight into the cotton with no base layer, so it's the softest finish. You'll barely feel it.",
  },
  notice: "Water-based ink (DTG), printed to order in the USA. No plastic transfer.",
} as const;

/** One line per decoration method, for the specs panel and meta descriptions. */
export const PRINT_METHOD_COPY = {
  dtg: "Printed straight into the fabric with water-based ink (DTG).",
  embroidery: "Embroidered: the design is stitched in thread.",
  dtf: "Heat-pressed transfer (DTF): the design is printed on a thin film and pressed on.",
  digital: "Printed with archival pigment inks.",
} as const;

export const CARE_COPY =
  "Wash cold, inside out, with like colors. No bleach. Hang dry or tumble low. If you iron, go inside out and never directly on the print. Dark colorways are pre-treated for the white base; a faint smell or stiffness goes away after the first wash.";

/** Rendered as `lead` + mailto link (`linkText`) + `tail`. */
export const SHIPPING_RETURNS = {
  lead: "Orders ship in 3 to 7 business days. Because items are produced specifically for each order, all sales are final. If an item arrives misprinted or damaged, ",
  linkText: "contact us at support@moshpitathletics.com",
  tail: " with photos for an immediate replacement.",
} as const;

/** Fine print under the product page's buy buttons. */
export const PDP_NOTE = "printed to order in the usa. all sales final. shipping calculated at checkout.";

export const CART_NOTE =
  "Shipping is calculated at checkout. Every item is printed to order, so all sales are final.";

/** Shown next to the pay button on Stripe Checkout. */
export const STRIPE_SUBMIT_NOTE =
  "All sales are final: every item is printed to order. If something arrives misprinted or damaged, email support@moshpitathletics.com with photos within 30 days of delivery for a replacement.";
