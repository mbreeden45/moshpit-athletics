"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Empties the bag once, after a completed checkout. */
export function ClearCart() {
  const { clear, ready } = useCart();
  // Wait for the saved bag to load, or it would come back after clearing.
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
