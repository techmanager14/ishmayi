import "server-only";

// Short-lived in-memory cache for admin reads from GoHighLevel. Every admin
// change calls invalidateAdmin(), so the panel never shows stale data after an
// edit, but browsing between pages doesn't re-download the whole store.

const TTL_MS = 45_000;
const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function memo<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, ttl = TTL_MS) {
  return (...args: A): Promise<R> => {
    const key = `${name}:${JSON.stringify(args)}`;
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<R>;
    const value = fn(...args);
    store.set(key, { at: Date.now(), value });
    // Never keep a failed request around.
    value.catch(() => store.get(key)?.value === value && store.delete(key));
    return value;
  };
}

export function invalidateAdmin(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
