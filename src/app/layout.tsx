import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { getCms } from "@/lib/cms";
import { site } from "@/lib/site";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-lato",
  display: "swap",
});

/** Title, description and share image are editable in the admin panel (Settings → SEO). */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getCms();
  return {
    metadataBase: new URL(site.url),
    title: { default: seo.title, template: `%s | ${site.name}` },
    description: seo.description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: site.name,
      title: seo.title,
      description: seo.description,
      ...(seo.image ? { images: [{ url: seo.image }] } : {}),
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions (e.g. Grammarly) add attributes to these two tags before React loads.
    <html lang="en-IN" className={lato.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-dvh" suppressHydrationWarning>{children}</body>
    </html>
  );
}
