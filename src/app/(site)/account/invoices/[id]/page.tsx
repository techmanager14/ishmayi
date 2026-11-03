import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/account/PrintButton";
import { InvoiceSheet } from "@/components/InvoiceSheet";
import { getCms } from "@/lib/cms";
import { customerInvoice } from "@/lib/customer/data";
import { currentCustomer } from "@/lib/customer/session";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/account");
  const { id } = await params;
  const [inv, cms] = await Promise.all([customerInvoice(customer.contactId, id).catch(() => null), getCms()]);
  if (!inv) notFound();

  return (
    <section className="container-page py-8 md:py-12">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/account" className="text-sm font-semibold text-burgundy hover:underline">
          ← My account
        </Link>
        <PrintButton />
      </div>
      <InvoiceSheet inv={inv} business={cms.business} className="print-area mx-auto mt-4 max-w-3xl border border-parchment" />
      {inv.amountDue > 0 && inv.status !== "void" && (
        <p className="no-print mx-auto mt-4 max-w-3xl rounded-xl bg-blush p-4 text-sm text-charcoal">
          To pay this invoice, open the invoice email we sent to <strong>{inv.contact.email || customer.email}</strong> and use its secure payment link — or{" "}
          <Link href="/contact" className="font-semibold text-burgundy underline">
            contact us
          </Link>
          .
        </p>
      )}
    </section>
  );
}
