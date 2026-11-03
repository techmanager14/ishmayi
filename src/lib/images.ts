// Image helpers. Shopify's CDN resizes on the fly via `?width=`; GoHighLevel
// media storage does not, so those images go through Next's image optimiser
// (/_next/image), which serves small WebP/AVIF copies instead of 1–2 MB PNGs.

/** Widths the optimiser allows (next.config.ts deviceSizes + imageSizes). */
const ALLOWED = [96, 160, 240, 320, 400, 480, 640, 828, 1080, 1280, 1920];
const OPTIMISED_HOSTS = ["assets.cdn.filesafe.space", "storage.googleapis.com"];

const host = (src: string) => {
  try {
    return new URL(src).hostname;
  } catch {
    return "";
  }
};
const isShopify = (src: string) => host(src).endsWith("cdn.shopify.com");
const isOptimisable = (src: string) => OPTIMISED_HOSTS.includes(host(src)) || src.startsWith("/");
const allowedWidth = (w: number) => ALLOWED.find((a) => a >= w) ?? ALLOWED[ALLOWED.length - 1];

/** Resized image URL (thumbnails, cards, banners). */
export const thumbUrl = (src: string, width = 160) => {
  if (!src) return src;
  if (isShopify(src)) {
    const u = new URL(src);
    u.searchParams.set("width", String(width));
    return u.toString();
  }
  if (isOptimisable(src) && !src.startsWith("/_next/") && !/\.svg($|\?)/i.test(src)) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${allowedWidth(width)}&q=80`;
  }
  return src;
};

/** srcset so phones download small images. */
export function shopifySrcSet(src: string, widths = [240, 320, 480, 640, 828]) {
  if (!src || (!isShopify(src) && !isOptimisable(src)) || /\.svg($|\?)/i.test(src)) return { src, srcSet: undefined as string | undefined };
  const ws = [...new Set(widths.map((w) => (isShopify(src) ? w : allowedWidth(w))))];
  return { src: thumbUrl(src, 480), srcSet: ws.map((w) => `${thumbUrl(src, w)} ${w}w`).join(", ") };
}

export const optimisedSrcSet = shopifySrcSet;
