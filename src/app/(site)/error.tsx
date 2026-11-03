"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-20 text-center" role="alert">
      <p className="font-display text-[1.6rem] leading-tight text-charcoal">Something went wrong</p>
      <p className="mx-auto mt-2 max-w-md text-ink-muted">This page didn&apos;t load properly. Please try again, or return to the home page.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
