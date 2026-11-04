/**
 * What each design is, in the words people actually search, keyed by any
 * Printify product id in the design (like DESIGN_NAMES).
 *
 * - `keywords` rides after the design's name in the page title, the line
 *   under the product name, structured data, image alt text and the Google
 *   product feed: "The Flagg Bars Tee: Cooper Flagg x Black Flag Shirt".
 * - `line` leads the product description.
 *
 * Names of bands, teams, players and events describe what the art
 * references; every line says the design is an unofficial fan tribute.
 */

export type SearchCopy = { keywords: string; line: string };

const TRIBUTE = "Unofficial fan tribute.";

export const SEARCH_COPY: Record<string, SearchCopy> = {
  // Bridgers '26 Skeleton Graphic Tee
  "6ae91c01c23e022f480b5502": {
    keywords: "Phoebe Bridgers Skeleton x Indiana Basketball Shirt",
    line: `A vintage Indiana basketball crest with a skeleton hand palming the ball, for Phoebe Bridgers fans with a midwest hoops streak. ${TRIBUTE}`,
  },
  // Pasadena caps (all three styles)
  "6ae253dc0626d40cc4067419": {
    keywords: "Pasadena City of Roses Rose Bowl Hat",
    line: `City of Roses script caps in Rose Bowl colorways: cardinal and gold for the 25-time Rose Bowl champs, blue and gold for the team that still calls Pasadena home. ${TRIBUTE}`,
  },
  "6a99f8b475e2ac9a620571b9": {
    keywords: "Blue Jays vs Expos Canada Day Shirt",
    line: `A vintage-style Canada Day matchup tee: the Toronto Blue Jays against the Montreal Expos, redrawn from a classic stadium graphic. ${TRIBUTE}`,
  },
  "6a7f60333e15472e280b0695": {
    keywords: "RÜFÜS DU SOL Rose Bowl 2025 Shirt",
    line: `A rose-and-script tee for RÜFÜS DU SOL's sold-out 2025 show at the Rose Bowl in Pasadena. ${TRIBUTE}`,
  },
  "6a7f6507efd4d89d1e0bb81b": {
    keywords: "RÜFÜS DU SOL Rose Bowl 2025 Poster",
    line: `A matte art print for RÜFÜS DU SOL's 2025 night at the Rose Bowl in Pasadena. ${TRIBUTE}`,
  },
  "69d454edf6c67e08bf06d7b8": {
    keywords: "Davis Schneider Blue Jays Baseball Card Shirt",
    line: `Toronto Blue Jays infielder Davis Schneider, mustache and all, on a retro baseball card tee. ${TRIBUTE}`,
  },
  "6a4d7e600e9c38654108213b": {
    keywords: "Ernie Clement Blue Jays Baseball Card Shirt",
    line: `A painted trading-card portrait of Toronto Blue Jays third baseman Ernie Clement, front and back. ${TRIBUTE}`,
  },
  "69377e0a9837d19d390e5578": {
    keywords: "Turnover Peripheral Vision Clown Shirt",
    line: `The clown from Turnover's Peripheral Vision era, back on a shirt after fans asked for it. ${TRIBUTE}`,
  },
  "693769c56a099916980abb74": {
    keywords: "Hot Mulligan Detroit Tiger Shirt, Fillmore 2025",
    line: `A tiger-and-Old-English tee for Hot Mulligan's December 2025 shows at The Fillmore Detroit. ${TRIBUTE}`,
  },
  "690ba5cec66e799d2a063832": {
    keywords: "Dodgers Japanese ドジャース Logo Shirt",
    line: `The Los Angeles Dodgers script, written in Japanese katakana (ドジャース), with a fastball streaking through. ${TRIBUTE}`,
  },
  "68f068010f158415e405017c": {
    keywords: "Ohtani Yamamoto Sasaki Dodgers Japanese Shirt",
    line: `The Dodgers' Japanese trio, Shohei Ohtani, Yoshinobu Yamamoto and Roki Sasaki, under the team name in katakana. ${TRIBUTE}`,
  },
  "68ed6fceed926f86860dfb34": {
    keywords: "My Chemical Romance Philadelphia 2025 Bat Hoodie",
    line: `The bat design from My Chemical Romance's 2025 show at Citizens Bank Park in Philadelphia, on a heavyweight hoodie. ${TRIBUTE}`,
  },
  "68ed6fcded926f86860dfb32": {
    keywords: "My Chemical Romance Philadelphia 2025 Bat Shirt",
    line: `The bat design from My Chemical Romance's 2025 show at Citizens Bank Park in Philadelphia. ${TRIBUTE}`,
  },
  "68ed6fcaed926f86860dfb2f": {
    keywords: "Turnstile Glow On x Turnover Peripheral Vision Shirt",
    line: `Turnstile's Glow On meets Turnover's Peripheral Vision, for everyone who has mixed up the two bands. ${TRIBUTE}`,
  },
  "68ed6fc6ed926f86860dfb2d": {
    keywords: "Cooper Flagg x Black Flag Shirt",
    line: `Cooper Flagg's name over Black Flag's four-bar logo, hardcore punk meets basketball. ${TRIBUTE}`,
  },
  "68ed6fc4ed926f86860dfb29": {
    keywords: "My Chemical Romance Dodger Stadium Black Parade Shirt",
    line: `"Blue Heaven on Earth" turned black for My Chemical Romance's two sold-out Dodger Stadium shows, in a Black Parade style. ${TRIBUTE}`,
  },
  "68ed6fc2ed926f86860dfb28": {
    keywords: "My Chemical Romance Shaky Knees 2025 Atlanta Scythe Shirt",
    line: `The scythe-and-script design from My Chemical Romance's 2025 Shaky Knees festival set in Atlanta. ${TRIBUTE}`,
  },
};
