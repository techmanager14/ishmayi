// Shape of products as the website uses them, whatever store they come from.

export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Product as shown in grids and shelves. */
export interface StoreProduct {
  /** Stable id used for cart lines and the product API (GHL product _id). */
  handle: string;
  title: string;
  subtitle: string | null;
  image: ProductImage | null;
  /** Lowest price, in rupees. */
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
}

/** Full product for the quick view and for pricing a cart. */
export interface ProductDetail {
  handle: string;
  title: string;
  subtitle: string | null;
  description: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  showVariantPicker: boolean;
  optionName: string;
  /** Can be paid for online (GHL products; old-catalogue items only in development). */
  purchasable?: boolean;
}

export interface CollectionSummary {
  count: number;
  /** Lowest in-stock price ("Starts from ₹…"). */
  minPrice: number | null;
  image: ProductImage | null;
}

export interface CatalogProvider {
  /** Products in a collection (or every product for the "all" handle). null = store unreachable. */
  collection(handle: string): Promise<StoreProduct[] | null>;
  /** One product with its variants. null = not found / unreachable. fresh = bypass caches (live prices). */
  product(handle: string, opts?: { fresh?: boolean }): Promise<ProductDetail | null>;
}
