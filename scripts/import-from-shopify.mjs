#!/usr/bin/env node
// Copy the client's own product photos (and optionally the products) from the
// old Shopify store into the GoHighLevel store.
//
//   node scripts/import-from-shopify.mjs            dry run: show the plan, change nothing
//   node scripts/import-from-shopify.mjs --apply    add photos to matching GHL products
//   node scripts/import-from-shopify.mjs --apply --create
//                                                   also create missing products (+ prices, collections)
//   --limit=N   only process the first N Shopify products (try --limit=1 first)
//
// Photos are re-hosted in GHL's media library (not hot-linked to Shopify).
// Needs GHL_PRIVATE_TOKEN + GHL_LOCATION_ID (from .env.local) with scopes:
//   products.readonly, products.write, products/prices.readonly, products/prices.write,
//   products/collection.readonly, products/collection.write, medias.write

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

// ---------- config ----------
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const CREATE = args.has("--create");
const LIMIT = Number([...args].find((a) => a.startsWith("--limit="))?.split("=")[1]) || Infinity;
const TOKEN = process.env.GHL_PRIVATE_TOKEN;
const LOCATION = process.env.GHL_LOCATION_ID;
const SHOP = (process.env.NEXT_PUBLIC_STORE_URL || "https://shop.drneetikaushik.com").replace(/\/$/, "");
const API = process.env.GHL_API_BASE || "https://services.leadconnectorhq.com";

// Shopify collection → GHL collection name (matches src/lib/catalogue.ts)
const COLLECTIONS = [
  { shopify: "rings", ghl: "Rings" },
  { shopify: "pendants", ghl: "Pendants" },
  { shopify: "crystals-ear-rings", ghl: "Earrings" },
  { shopify: "malas", ghl: "Malas" },
  { shopify: "silver-crystal-jewellery", ghl: "Silver" },
  { shopify: "rudraksha", ghl: "Rudraksha" },
  { shopify: "jaap-malas", ghl: "Jaap Malas" },
];
const MAX_PHOTOS = 8;

if (!TOKEN || !LOCATION) {
  console.error("Set GHL_PRIVATE_TOKEN and GHL_LOCATION_ID in .env.local first.");
  process.exit(1);
}

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? "").split("|")[0].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (s) => norm(s).replace(/\s+/g, "-");
const isBracelet = (p) => /bracelet/i.test(`${p.product_type ?? ""} ${p.title ?? p.name ?? ""}`);

async function ghl(method, path, { query = {}, json, form } = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Version: "2021-07-28",
        Accept: "application/json",
        ...(json ? { "Content-Type": "application/json" } : {}),
      },
      body: json ? JSON.stringify(json) : form,
    });
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${typeof body === "string" ? body.slice(0, 200) : body?.message ?? ""}`);
    await sleep(150); // stay well under GHL's rate limit
    return body;
  }
  throw new Error(`${method} ${path} → rate limited`);
}

async function shopifyCollection(handle) {
  const res = await fetch(`${SHOP}/collections/${handle}/products.json?limit=250`);
  if (!res.ok) throw new Error(`Shopify ${handle} → ${res.status}`);
  return (await res.json()).products ?? [];
}

const toParagraphHtml = (html) =>
  String(html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/\s(style|class|data-[\w-]+)="[^"]*"/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .trim();

// ---------- main ----------
console.log(`\n${APPLY ? "APPLYING" : "DRY RUN (nothing will change)"}${CREATE ? " · create missing products" : ""}\n`);

// 1. Shopify catalogue (client's own products), grouped by collection, no bracelets
const shopify = new Map(); // handle -> { product, collections:Set }
for (const c of COLLECTIONS) {
  for (const p of await shopifyCollection(c.shopify)) {
    if (isBracelet(p)) continue;
    const entry = shopify.get(p.handle) ?? { product: p, collections: new Set() };
    entry.collections.add(c.ghl);
    shopify.set(p.handle, entry);
  }
}
console.log(`Shopify: ${shopify.size} products (bracelets excluded)`);

// 2. GHL products + collections
const ghlProducts = [];
try {
  for (let offset = 0; ; offset += 100) {
    const page = await ghl("GET", "/products/", { query: { locationId: LOCATION, limit: 100, offset } });
    ghlProducts.push(...(page.products ?? []));
    if ((page.products ?? []).length < 100) break;
  }
} catch (err) {
  console.error(`\nCan't read GoHighLevel products: ${err.message}`);
  console.error("Give the Private Integration token the scopes listed at the top of this script, then run again.");
  process.exit(1);
}
const byName = new Map(ghlProducts.map((p) => [norm(p.name), p]));
console.log(`GoHighLevel: ${ghlProducts.length} products`);

const colRes = await ghl("GET", "/products/collections", { query: { altId: LOCATION, altType: "location", limit: 100 } });
const ghlCollections = new Map((colRes.data ?? colRes.collections ?? []).map((c) => [norm(c.name), c._id]));

async function collectionId(name) {
  const key = norm(name);
  if (ghlCollections.has(key)) return ghlCollections.get(key);
  if (!APPLY || !CREATE) return `(new) ${name}`;
  const res = await ghl("POST", "/products/collections", { json: { altId: LOCATION, altType: "location", name, slug: slugify(name) } });
  const id = res.data?._id ?? res._id;
  ghlCollections.set(key, id);
  console.log(`  + collection "${name}"`);
  return id;
}

/** Download the photo and upload the actual file to GHL's media library. */
async function rehost(url, name) {
  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${url} → ${img.status}`);
  const type = img.headers.get("content-type") || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const form = new FormData();
  form.set("file", new Blob([await img.arrayBuffer()], { type }), `${slugify(name).slice(0, 60) || "photo"}.${ext}`);
  form.set("name", name.slice(0, 80));
  const res = await ghl("POST", "/medias/upload-file", { form });
  const hosted = res.url ?? res.fileUrl ?? res.data?.url;
  if (!hosted || /cdn.shopify.com/.test(hosted)) throw new Error("upload did not return a GHL-hosted URL");
  return hosted;
}

const onShopify = (p) => [p.image, ...(p.medias ?? []).map((m) => m.url)].some((u) => /cdn.shopify.com/.test(u ?? ""));

const stats = { photosAdded: 0, created: 0, skipped: 0, alreadyHasPhotos: 0, failed: 0 };
let n = 0;
for (const { product: sp, collections } of shopify.values()) {
  if (n++ >= LIMIT) break;
  const title = sp.title.split("|")[0].trim();
  const existing = byName.get(norm(sp.title));
  const photos = (sp.images ?? []).slice(0, MAX_PHOTOS).map((i) => i.src);

  try {
    if (existing) {
      const full = await ghl("GET", `/products/${existing._id}`, { query: { locationId: LOCATION } });
      const hasPhotos = (full.medias ?? []).length > 0 || full.image;
      if (hasPhotos && !onShopify(full)) {
        stats.alreadyHasPhotos++;
        continue;
      }
      console.log(`• ${title}: ${hasPhotos ? "move" : "add"} ${photos.length} photo(s) ${hasPhotos ? "from Shopify into GHL" : "to existing GHL product"}`);
      if (APPLY) {
        const urls = [];
        for (const [i, src] of photos.entries()) urls.push(await rehost(src, `${title} ${i + 1}`));
        // PUT replaces the product, so send every field we want to keep.
        await ghl("PUT", `/products/${existing._id}`, {
          json: {
            name: full.name,
            locationId: LOCATION,
            productType: full.productType ?? "PHYSICAL",
            description: full.description ?? "",
            availableInStore: full.availableInStore ?? true,
            collectionIds: full.collectionIds ?? [],
            image: urls[0],
            medias: urls.map((url, i) => ({ id: randomUUID(), title: `${title} ${i + 1}`, url, type: "image", isFeatured: i === 0 })),
          },
        });
      }
      stats.photosAdded++;
      continue;
    }

    if (!CREATE) {
      stats.skipped++;
      continue;
    }

    const variants = (sp.variants ?? []).filter((v) => Number(v.price) > 0);
    console.log(`• ${title}: create in GHL with ${photos.length} photo(s), ${variants.length} price(s), collections ${[...collections].join(", ")}`);
    if (APPLY) {
      const urls = [];
      for (const [i, src] of photos.entries()) urls.push(await rehost(src, `${title} ${i + 1}`));
      const collectionIds = [];
      for (const c of collections) collectionIds.push(await collectionId(c));
      const created = await ghl("POST", "/products/", {
        json: {
          name: sp.title.trim(),
          locationId: LOCATION,
          description: toParagraphHtml(sp.body_html),
          productType: "PHYSICAL",
          availableInStore: true,
          image: urls[0],
          medias: urls.map((url, i) => ({ id: randomUUID(), title: `${title} ${i + 1}`, url, type: "image", isFeatured: i === 0 })),
          collectionIds,
        },
      });
      const productId = created._id ?? created.product?._id;
      for (const v of variants) {
        const amount = Number(v.price);
        const compare = Number(v.compare_at_price);
        await ghl("POST", `/products/${productId}/price`, {
          json: {
            product: productId,
            locationId: LOCATION,
            name: v.title === "Default Title" ? title : v.title,
            type: "one_time",
            currency: "INR",
            amount,
            ...(compare > amount ? { compareAtPrice: compare } : {}),
            trackInventory: false,
          },
        });
      }
    }
    stats.created++;
  } catch (err) {
    stats.failed++;
    console.error(`  ✗ ${title}: ${err.message}`);
    if (/not authorized for this scope|401/.test(err.message)) {
      console.error("\nThe GHL token is missing permissions. See the scope list at the top of this script.");
      process.exit(1);
    }
  }
}

console.log(`\nSummary${APPLY ? "" : " (dry run)"}:`);
console.log(`  existing products whose photos were added / moved into GHL: ${stats.photosAdded}`);
console.log(`  products ${APPLY ? "created" : "to create"}: ${stats.created}${CREATE ? "" : " (run with --create to create missing products)"}`);
console.log(`  existing products that already have photos (left alone): ${stats.alreadyHasPhotos}`);
console.log(`  Shopify products with no GHL match (not created): ${stats.skipped}`);
if (stats.failed) console.log(`  failed: ${stats.failed}`);
if (!APPLY) console.log("\nNothing was changed. Re-run with --apply to make these changes.");
