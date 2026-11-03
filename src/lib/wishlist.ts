"use client";

import { useSyncExternalStore } from "react";
import type { StoreProduct } from "./catalog/types";

// The wishlist lives in the visitor's browser (localStorage), like the bag. Prices
// saved here are for display only; the product page and checkout always show live ones.

const KEY = "ishmayi-wishlist-v1";
const EVENT = "ishmayi:wishlist-change";
const MAX_ITEMS = 100;

let cache: StoreProduct[] | null = null;
const EMPTY: StoreProduct[] = [];

function read(): StoreProduct[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as StoreProduct[]) : [];
    cache = Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.handle === "string" && typeof p.title === "string").slice(0, MAX_ITEMS) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: StoreProduct[]) {
  cache = items;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked: the wishlist still works for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
};

export function useWishlist(): StoreProduct[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const wishlist = {
  toggle(product: StoreProduct) {
    const items = read();
    write(items.some((p) => p.handle === product.handle) ? items.filter((p) => p.handle !== product.handle) : [product, ...items].slice(0, MAX_ITEMS));
  },
  remove(handle: string) {
    write(read().filter((p) => p.handle !== handle));
  },
};
