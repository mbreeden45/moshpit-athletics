import "server-only";
import { cache } from "react";
import { quoteShipping, type PrintifyLineItem } from "./printify";

/** Customer-facing shipping: Printify's quote, rounded up to the next whole dollar. */
export const roundUpDollar = (cents: number) => Math.ceil(cents / 100) * 100;

/**
 * Standard and Express prices (cents, rounded as charged at checkout) for one
 * unit of a product, for structured data. Null when Printify can't quote.
 */
export const quoteForProduct = cache(
  async (productId: string, variantId: number): Promise<{ standard?: number; express?: number } | null> => {
    try {
      const item: PrintifyLineItem = { product_id: productId, variant_id: variantId, quantity: 1 };
      const q = await quoteShipping([item], { cached: true });
      return {
        standard: q.standard ? roundUpDollar(q.standard) : undefined,
        express: q.priority ? roundUpDollar(q.priority) : undefined,
      };
    } catch (err) {
      console.warn(`[shipping] Quote for ${productId}/${variantId} failed:`, err);
      return null;
    }
  },
);
