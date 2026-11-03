import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    // Render every page in one build worker so they share a single GHL catalogue
    // fetch — parallel workers each fetch it and trip GHL's rate limit.
    staticGenerationMinPagesPerWorker: 1000,
    // Admin uploads (photos are resized in the browser first; short videos).
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // GoHighLevel media storage (product photos, banners) is resized by Next's
    // image optimiser — originals are often 1–2 MB PNGs.
    remotePatterns: [new URL("https://assets.cdn.filesafe.space/**"), new URL("https://storage.googleapis.com/msgsndr/**")],
    deviceSizes: [480, 640, 828, 1080, 1280, 1920],
    imageSizes: [96, 160, 240, 320, 400],
    qualities: [70, 80, 90],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      { source: "/book-consultation", destination: "/shop", permanent: true },
      { source: "/numerology-consultation", destination: "/shop", permanent: true },
      { source: "/jewellery", destination: "/shop", permanent: true },
      { source: "/faqs-contact", destination: "/faqs", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Enquiry responses carry personal data — never cache them anywhere.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;
