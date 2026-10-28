#!/usr/bin/env node
/**
 * Shop discovery helper.
 *   npm run discover-shop
 *
 * Calls GET https://api.printify.com/v1/shops.json with PRINTIFY_API_TOKEN
 * (read from the environment or .env.local) and prints the Pop-Up store's
 * id to paste into PRINTIFY_SHOP_ID. Pass --mock to run without a token.
 */

const MOCK_SHOPS = [
  { id: 22179709, title: "Mosh Pit Athletics", sales_channel: "woocommerce" },
  { id: 23141482, title: "Mosh Pit Athletics", sales_channel: "etsy" },
  { id: 24668106, title: "Mosh Pit Athletics", sales_channel: "tiktok" },
  { id: 24807399, title: "Mosh Pit Athletics", sales_channel: "storefront" },
];

async function fetchShops() {
  if (process.argv.includes("--mock")) {
    console.log("(mock mode — using a sample shops.json response)\n");
    return MOCK_SHOPS;
  }
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    console.error("PRINTIFY_API_TOKEN is not set. Add it to .env.local or run with --mock.");
    process.exit(1);
  }
  const res = await fetch("https://api.printify.com/v1/shops.json", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "MoshPitAthletics-Storefront/1.0",
    },
  });
  if (!res.ok) {
    console.error(`Printify responded ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  return res.json();
}

const shops = await fetchShops();
console.table(shops);

const popup =
  shops.find(
    (s) => s.sales_channel === "storefront" && s.title.trim().toLowerCase() === "mosh pit athletics",
  ) ?? shops.find((s) => s.sales_channel === "storefront");

if (!popup) {
  console.error('\nNo Pop-Up store (sales_channel "storefront") found on this account.');
  process.exit(1);
}

console.log(`\nPop-Up store: "${popup.title}" → id ${popup.id}`);
console.log(`\nAdd to .env.local:\nPRINTIFY_SHOP_ID=${popup.id}`);
