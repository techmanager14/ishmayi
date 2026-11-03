"use client";

import { useSyncExternalStore } from "react";

// The cart lives in the visitor's browser (localStorage). Prices stored here are
// for display only — the server re-prices every line from the store at checkout.

export interface CartLine {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string | null;
  image: string | null;
  price: number;
  qty: number;
}

const KEY = "trivana-cart-v1";
export const MAX_QTY = 10;
export const MAX_LINES = 20;
const EVENT = "trivana:cart-change";
const OPEN_EVENT = "trivana:cart-open";

let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter((l) => l && typeof l.productId === "string" && typeof l.variantId === "string" && l.qty > 0).slice(0, MAX_LINES)
      : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage blocked: cart still works for this page view */
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

/** Live cart contents for components. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.qty, 0);

export const cart = {
  add(line: Omit<CartLine, "qty">, qty = 1) {
    const lines = [...read()];
    const i = lines.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
    if (i >= 0) lines[i] = { ...lines[i], ...line, qty: Math.min(MAX_QTY, lines[i].qty + qty) };
    else if (lines.length < MAX_LINES) lines.push({ ...line, qty: Math.min(MAX_QTY, qty) });
    write(lines);
  },
  setQty(productId: string, variantId: string, qty: number) {
    const lines = read()
      .map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty: Math.max(0, Math.min(MAX_QTY, qty)) } : l))
      .filter((l) => l.qty > 0);
    write(lines);
  },
  remove(productId: string, variantId: string) {
    write(read().filter((l) => !(l.productId === productId && l.variantId === variantId)));
  },
  /** Replace display prices/titles with what the server priced. */
  sync(lines: CartLine[]) {
    write(lines);
  },
  clear() {
    write([]);
  },
  open() {
    window.dispatchEvent(new Event(OPEN_EVENT));
  },
  OPEN_EVENT,
};
