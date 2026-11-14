import type { Metadata } from "next";
import { SignIn } from "@/components/account/SignIn";
import { Checkout } from "@/components/Checkout";
import { Breadcrumbs } from "@/components/Sections";
import { customerProfile } from "@/lib/customer/data";
import { currentCustomer, pendingEmail } from "@/lib/customer/session";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Guests can check out; signing in is optional and fills in saved details.
  const customer = await currentCustomer();
  const profile = customer ? await customerProfile(customer.contactId).catch(() => null) : null;
  const pending = customer ? null : await pendingEmail();

  return (
    <>
      <section className="border-b border-parchment bg-ivory-deep/60">
        <div className="container-page py-5 md:py-7">
          <Breadcrumbs items={[{ href: "/shop", label: "Shop" }, { label: "Checkout" }]} />
          <h1 className="mt-3 text-[1.6rem] leading-tight font-bold text-charcoal md:text-[2rem]">Secure checkout</h1>
        </div>
      </section>
      <section className="container-page py-6 md:py-10">
        {!customer && (
          <details open={!!pending} className="group mx-auto mb-6 max-w-5xl rounded-2xl border border-parchment bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm [&::-webkit-details-marker]:hidden">
              <span>
                <b className="text-charcoal">Checking out as a guest.</b> <span className="text-ink-muted">Have an account? Sign in to use your saved details.</span>
              </span>
              <span className="shrink-0 font-bold text-burgundy group-open:hidden">Sign in</span>
              <span className="hidden shrink-0 font-bold text-burgundy group-open:inline">Close</span>
            </summary>
            <div className="border-t border-parchment p-5">
              <SignIn pending={pending} next="/checkout" />
            </div>
          </details>
        )}
        <Checkout
          guest={!customer}
          profile={{
            email: customer?.email ?? "",
            fullName: profile?.fullName || customer?.name || "",
            phone: profile?.phone ?? "",
            address1: profile?.address1 ?? "",
            city: profile?.city ?? "",
            state: profile?.state ?? "",
            pincode: profile?.pincode ?? "",
          }}
        />
      </section>
    </>
  );
}
