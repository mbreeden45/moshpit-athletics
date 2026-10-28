/**
 * Garment specs in our own words, keyed by Printify blueprint_id. These
 * replace Printify's and the manufacturers' stock copy everywhere on the
 * site. Only the facts (fiber, weight, construction) carry over; every
 * sentence is original. Brand and model names appear only to identify the
 * blank, with the disclaimer below.
 */

export type GarmentSpec = {
  /** One or two plain sentences on what the blank is and how it wears. */
  summary: string;
  /** Short factual points. */
  points: string[];
};

export const BRAND_DISCLAIMER =
  "Brand and model names identify the blank we print on. Mosh Pit Athletics is not affiliated with or endorsed by the manufacturer.";

const SPECS: Record<number, GarmentSpec> = {
  // Shaka Wear SHMHSS — Max Heavyweight Short Sleeve
  1716: {
    summary:
      "A dense, 7.5 oz cotton tee with a boxy body and a slight drop at the shoulder. The thick collar keeps its shape and the cotton is built to resist shrinking, so the fit you order is the fit you keep.",
    points: [
      "7.5 oz (245–255 GSM) 100% US cotton; heather and charcoal colors are cotton/poly blends",
      "16-singles yarn for a firm, structured hand",
      '1" collar with double-needle stitching',
      "Taped shoulder to shoulder",
      '1" double-needle sleeve and bottom hems',
      "Oversized, relaxed cut with a slight drop shoulder",
      "Quarter-turned body, so no crease down the front",
      "Sizes S to 7XL",
    ],
  },
  // Comfort Colors 1717 — Garment-Dyed T-shirt
  706: {
    summary:
      "Dyed after it's sewn, so the color settles into a soft, lived-in tone from the first wear. Ring-spun cotton, a relaxed cut and a tubular body with no side seams.",
    points: [
      "6.1 oz 100% ring-spun US cotton",
      "Garment-dyed and preshrunk",
      "Relaxed fit",
      "Tubular body, no side seams",
      "Double-needle stitching throughout",
      "Garment dyeing means each shirt's shade varies slightly",
      "Sewn-in label",
    ],
  },
  // American Apparel 1301 — Classic Tee
  725: {
    summary:
      "A mid-weight cotton tee with a classic, true-to-size cut. Smooth enough for detailed prints and sturdy enough for regular rotation.",
    points: [
      "6.0 oz cotton; solid colors are 100% cotton, heathers are cotton/poly blends",
      "Classic fit",
      "Tear-away label",
    ],
  },
  // Champion T453W — Women's Heritage Cropped T-Shirt
  672: {
    summary:
      "A cropped women's cut in a heavy 7 oz cotton jersey, finished with double-needle stitching and the maker's C patch on the left sleeve.",
    points: [
      "7.0 oz 100% cotton jersey",
      "Modern cropped fit",
      "Double-needle stitching",
      "C logo patch on the left sleeve",
      "Sewn-in label",
    ],
  },
  // American Apparel 1302GD — Women's Garment-Dyed Heavyweight Cropped Tee
  5784: {
    summary:
      "A boxy, cropped women's tee in heavyweight US cotton, garment-dyed for a faded, broken-in color.",
    points: [
      "6.0 oz 100% US cotton",
      "Garment-dyed, low shrink",
      "Boxy, cropped fit",
      "Rolled-forward shoulder seam",
      "Taped neck and shoulders",
      "Tear-away label",
    ],
  },
  // Shaka Wear SHGDD — Garment-Dyed Drop-Shoulder T-Shirt
  1723: {
    summary:
      "A heavyweight cotton tee, garment-dyed for a washed, vintage color, with dropped shoulders and a relaxed, boxy body.",
    points: [
      "7.5 oz 100% US cotton",
      "Garment-dyed and shrink-resistant",
      "Drop shoulder, boxy fit",
      "Ribbed crew collar with double-needle stitching",
      "Shoulder seam set forward to sit comfortably at the neck",
      "Tear-away label",
      "Assembled in the USA",
    ],
  },
  // Comfort Colors 3023CL — Women's Boxy Tee
  1393: {
    summary: "An oversized women's tee with a boxy, slightly cropped body in soft ring-spun US cotton.",
    points: [
      "6.1 oz 100% ring-spun US cotton",
      "Boxy, slightly cropped fit",
      "Pigment-dyed, so each shirt's shade varies slightly",
      "Sewn-in twill label",
    ],
  },
  // Gildan 5000 — Heavy Cotton Tee
  6: {
    summary:
      "A dependable heavy cotton tee: a tight knit that holds crisp print detail, on a body with no side seams.",
    points: [
      "5.3 oz 100% cotton; heather colors contain polyester",
      "Tubular body, no side seams",
      "Taped shoulders",
      "Classic fit",
    ],
  },
  // Gildan 64000 — Softstyle T-Shirt
  145: {
    summary: "A lighter, softer everyday tee with a modern unisex cut and no side seams.",
    points: [
      "Ring-spun cotton; solid colors are 100% cotton, heathers are blends",
      "Lightweight knit",
      "Tubular body, no side seams",
      "Twill-taped shoulders",
      "Ribbed collar that resists curling",
    ],
  },
  // Bella+Canvas 1010 — Women's Micro Rib Baby Tee
  5358: {
    summary: "A fitted, mid-length baby tee in a stretchy micro rib knit.",
    points: ["5.3 oz cotton/polyester blend (52/48)", "1x1 micro rib", "Fitted, mid-length cut"],
  },
  // Lane Seven LS14001 — Three-Panel Fleece Hoodie
  439: {
    summary:
      "A medium-heavy fleece hoodie with a brushed interior and a clean, structured outside that carries a large print without bulk.",
    points: [
      "8.25 oz fleece, 80% combed ring-spun cotton / 20% recycled polyester (varies by color)",
      "Soft three-end fleece interior",
      "Regular fit, runs true to size",
      "Flat drawcords, ribbed cuffs and hem",
      "Double-needle topstitching on every seam",
      "Under 5% shrinkage",
      "Tear-away label",
    ],
  },
  // OTTO Cap 31-069 — Mid Profile Baseball Cap
  2041: {
    summary:
      "A structured five-panel cap with a mid-height crown. Buckram backs the seamless front panel so the embroidery sits flat and the shape stays put.",
    points: [
      "65% polyester / 35% cotton",
      "Structured five-panel, mid profile",
      "Seamless front panel with buckram",
      "Undervisor and sweatband match the cap",
      "Six sewn eyelets",
      "Plastic snap closure",
    ],
  },
  // AS Colour 1114 — Surf Cap
  1583: {
    summary: "An unstructured nylon cap that packs flat, dries fast and stays light on long days outside.",
    points: [
      "100% recycled nylon",
      "Unstructured, mid profile",
      "Single front panel",
      "Quick-dry fabric",
      "Undervisor matches the cap color",
      "Adjustable plastic snapback, one size",
    ],
  },
  // Comfort Colors CCRC0 — Sunwashed Rope Cap
  6597: {
    summary: "A semi-structured five-panel cap in lightweight ripstop, with a high crown and a rope braid across the bill.",
    points: [
      "3.69 oz 100% polyester micro ripstop",
      "Semi-structured five-panel, high profile",
      "Half-moon buckram up front",
      "Slightly curved bill with rope braid",
      "Performance sweatband",
      "Plastic snapback",
    ],
  },
  // Yupoong 6007 — Flat Bill Cap
  1753: {
    summary: "A high-crown, structured snapback in cotton twill with a flat bill and a green undervisor.",
    points: [
      "100% cotton twill",
      "Structured five-panel, high profile",
      "Flat bill, green undervisor",
      "Sewn eyelets",
      'Snapback, fits 21.6"–23.6" (55–60 cm)',
    ],
  },
  // Matte Vertical Posters
  282: {
    summary:
      "Printed with pigment archival inks on heavy, museum-grade matte paper: no glare, deep blacks, made to hang for years.",
    points: [
      "Museum-grade archival matte paper, 175–189 g/m² depending on the print shop",
      "Pigment archival inks",
      'Size may vary by up to 1/16"',
      "For indoor display",
      "Ships unframed, to US addresses only",
    ],
  },
  // Pet Bandana
  562: {
    summary: "A soft polyester bandana, printed on one side and sewn ready to tie.",
    points: ['100% polyester', 'Two sizes: 20" × 9.75" and 27" × 13"', "One-sided print", "Sewn-in label"],
  },
  // Clip-on Pet Bandana
  1672: {
    summary: "A printed bandana on an adjustable black collar that clips on and comes off easily.",
    points: ["100% polyester", "Adjustable, removable collar", "Collar is not printed"],
  },
};

export function getGarmentSpec(blueprintId: number): GarmentSpec | null {
  return SPECS[blueprintId] ?? null;
}
