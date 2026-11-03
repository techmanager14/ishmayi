import Link from "next/link";
import { SiteChrome } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <SiteChrome>
      <section className="container-page py-20 text-center md:py-28">
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-3 font-display text-[1.75rem] leading-tight text-charcoal md:text-[2.4rem]">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">It may have moved, or the piece may no longer be available.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="btn btn-primary">Shop all products</Link>
          <Link href="/" className="btn btn-outline">Back to home</Link>
        </div>
      </section>
    </SiteChrome>
  );
}
