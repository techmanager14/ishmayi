import "server-only";

// Generic GoHighLevel (LeadConnector v2) request helper for the admin panel and
// the content store. Retries rate limits, server errors and dropped connections.

const env = (k: string) => process.env[k]?.trim() ?? "";
export const GHL_API = "https://services.leadconnectorhq.com";
export const locationId = () => env("GHL_LOCATION_ID");

export class GhlError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

interface Options {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Cache GET responses with these tags (default: never cached). */
  cache?: { tags: string[]; revalidate: number };
  /** Raw body (e.g. FormData for uploads). */
  form?: FormData;
}

export async function ghlApi<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, opts: Options = {}): Promise<T> {
  const url = new URL(GHL_API + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${env("GHL_PRIVATE_TOKEN")}`,
          Version: "2021-07-28",
          Accept: "application/json",
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
        ...(method === "GET" && opts.cache ? { next: { tags: opts.cache.tags, revalidate: opts.cache.revalidate } } : { cache: "no-store" as const }),
        signal: AbortSignal.timeout(20000),
      });
      const text = await res.text();
      if (res.status === 429 || res.status >= 500) {
        last = `${method} ${path} → ${res.status}`;
      } else if (!res.ok) {
        throw new GhlError(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`, res.status, text);
      } else {
        return (text ? JSON.parse(text) : {}) as T;
      }
    } catch (err) {
      if (err instanceof GhlError) throw err;
      last = err instanceof Error ? err.message : "network error";
    }
    await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
  }
  throw new GhlError(last || `${method} ${path} failed`, 0, "");
}

export const ghlConfigured = () => Boolean(env("GHL_PRIVATE_TOKEN") && env("GHL_LOCATION_ID"));
