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
  // An account is required to check out; the bag stays saved while the customer signs in.
  const customer = await currentCustomer();
  const profile = customer ? await customerProfile(customer.contactId).catch(() => null) : null;

  return (
    <>
      <section className="border-b border-parchment bg-ivory-deep/60">
        <div className="container-page py-5 md:py-7">
          <Breadcrumbs items={[{ href: "/shop", label: "Shop" }, { label: "Checkout" }]} />
          <h1 className="mt-3 text-[1.6rem] leading-tight font-bold text-charcoal md:text-[2rem]">{customer ? "Secure checkout" : "Sign in to check out"}</h1>
          {!customer && <p className="mt-1 text-ink-muted">Your bag is saved. Sign in or create a free account to continue, and track your order any time.</p>}
        </div>
      </section>
      <section className="container-page py-6 md:py-10">
        {customer ? (
          <Checkout
            profile={{
              email: customer.email,
              fullName: profile?.fullName || customer.name,
              phone: profile?.phone ?? "",
              address1: profile?.address1 ?? "",
              city: profile?.city ?? "",
              state: profile?.state ?? "",
              pincode: profile?.pincode ?? "",
            }}
          />
        ) : (
          <SignIn pending={await pendingEmail()} next="/checkout" />
        )}
      </section>
    </>
  );
}
