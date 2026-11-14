// Deletes the placeholder products copied in for testing (listed in demo-products.json).
//
//   node scripts/delete-demo-products.mjs          → shows what would be deleted
//   node scripts/delete-demo-products.mjs --apply  → deletes them from GoHighLevel
//
// Reads GHL_PRIVATE_TOKEN and GHL_LOCATION_ID from .env.local. Only the products in the
// list are touched; everything else in the store stays as it is.

import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const LIST = new URL("./demo-products.json", import.meta.url);
const APPLY = process.argv.includes("--apply");
const products = JSON.parse(readFileSync(LIST, "utf8"));

for (const p of products) {
  if (!APPLY) {
    console.log(`would delete: ${p.name}`);
    continue;
  }
  const res = await fetch(`https://services.leadconnectorhq.com/products/${p.id}?locationId=${env.GHL_LOCATION_ID}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.GHL_PRIVATE_TOKEN}`, Version: "2021-07-28", Accept: "application/json" },
  });
  console.log(`${res.ok || res.status === 404 ? "deleted" : `failed (${res.status})`}: ${p.name}`);
  if (res.ok || res.status === 404) p.deleted = true;
}
if (APPLY) writeFileSync(LIST, JSON.stringify(products.filter((p) => !p.deleted), null, 2) + "\n");
console.log(APPLY ? "Done." : `${products.length} placeholder products. Run again with --apply to delete them.`);
