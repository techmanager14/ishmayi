import "server-only";
import { cache } from "react";
import { defaultCms, normaliseCms, type CmsContent } from "./cms-types";
import { ghlApi, ghlConfigured, locationId } from "./ghl-api";

// The website's editable content is stored as one JSON "custom value" in the
// client's GoHighLevel location (Settings → Custom Values → trivana_website_content),
// so no extra database is needed. Pages read it through the cache (tag "cms");
// saving from the admin panel purges that tag.

export const CMS_TAG = "cms";
const NAME = "trivana_website_content";

interface CustomValue {
  id: string;
  name: string;
  value: string;
}

// Write-through copy of the last content saved on this server. Page rebuilds
// right after a save use it, so they can never pick up the previous version
// from the data cache. Other servers rely on the tag expiry.
let lastSaved: { at: number; content: CmsContent } | null = null;
const LAST_SAVED_TTL = 10 * 60 * 1000;

async function findValue(fresh: boolean): Promise<CustomValue | null> {
  const res = await ghlApi<{ customValues?: CustomValue[] }>("GET", `/locations/${locationId()}/customValues`, fresh ? {} : { cache: { tags: [CMS_TAG], revalidate: 300 } });
  return res.customValues?.find((v) => v.name === NAME) ?? null;
}

async function read(fresh: boolean): Promise<CmsContent> {
  if (!ghlConfigured()) return defaultCms;
  if (!fresh && lastSaved && Date.now() - lastSaved.at < LAST_SAVED_TTL) return lastSaved.content;
  try {
    const v = await findValue(fresh);
    return v?.value ? normaliseCms(JSON.parse(v.value)) : defaultCms;
  } catch (err) {
    console.warn(`[cms] using built-in content: ${err instanceof Error ? err.message : "error"}`);
    return lastSaved?.content ?? defaultCms;
  }
}

/** Content for rendering pages (cached). */
export const getCms = cache(() => read(false));

/** Content as currently stored (uncached) — for the admin editor and pricing. */
export const getCmsFresh = () => read(true);

export async function saveCms(content: CmsContent) {
  const clean = normaliseCms(content);
  const value = JSON.stringify(clean);
  const existing = await findValue(true);
  if (existing) await ghlApi("PUT", `/locations/${locationId()}/customValues/${existing.id}`, { body: { name: NAME, value } });
  else await ghlApi("POST", `/locations/${locationId()}/customValues`, { body: { name: NAME, value } });
  lastSaved = { at: Date.now(), content: clean };
}
