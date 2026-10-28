import "server-only";

/**
 * Server-side environment. PRINTIFY_API_TOKEN must never reach the client,
 * which is why this module imports "server-only".
 */
export const env = {
  printifyToken: process.env.PRINTIFY_API_TOKEN?.trim() || "",
  printifyShopId: process.env.PRINTIFY_SHOP_ID?.trim() || "",
};

export function hasPrintifyToken(): boolean {
  return env.printifyToken.length > 0;
}
