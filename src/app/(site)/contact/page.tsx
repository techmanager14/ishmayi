import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/Sections";
import { TrackedLink } from "@/components/Tracking";
import { getCms } from "@/lib/cms";
import { shippingLabel, waLink } from "@/lib/cms-types";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Ishmayi by phone, WhatsApp, email or our contact form, for questions about products, orders and bulk orders.",
  alternates: { canonical: "/contact" },
};

const row = "flex items-center gap-4 border-b border-parchment py-4 transition-colors hover:text-gold-deep";
const label = "block text-[0.66rem] tracking-[0.2em] text-ink-muted uppercase";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [{ topic }, cms] = await Promise.all([searchParams, getCms()]);
  const { phone, email, whatsapp } = cms.contact;
  const wa = waLink(whatsapp, "Hello Ishmayi, I have a question.");

  return (
    <>
      <PageHero eyebrow="Contact us" title="We'd love to hear from you">
        <p>Questions about a piece, an order or a bulk purchase? Reach us any way you like and we&apos;ll get back to you as soon as we can.</p>
      </PageHero>

      <section className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <h2 className="font-display text-[1.3rem] font-bold text-charcoal">Reach us directly</h2>
          <ul className="mt-3 border-t border-parchment">
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={row}>
                  <Phone className="h-5 w-5 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
                  <span>
                    <span className={label}>Call</span>
                    {phone}
                  </span>
                </a>
              </li>
            )}
            {wa && (
              <li>
                <TrackedLink href={wa} target="_blank" rel="noopener noreferrer" event="whatsapp_click" params={{ location: "contact_page" }} className={row}>
                  <MessageCircle className="h-5 w-5 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
                  <span>
                    <span className={label}>WhatsApp</span>
                    +{whatsapp}
                  </span>
                </TrackedLink>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className={row}>
                  <Mail className="h-5 w-5 text-gold-deep" strokeWidth={1.3} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className={label}>Email</span>
                    <span className="block truncate">{email}</span>
                  </span>
                </a>
              </li>
            )}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-ink-muted">
            We&apos;re an online store, delivering across India: {shippingLabel(cms.store).toLowerCase()}, {cms.store.deliveryDays} days from confirmation.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Your question may already be answered in our <Link href="/faqs" className="link-underline">FAQs</Link>.
          </p>
        </div>

        <div id="message" className="scroll-mt-24 rounded-2xl border border-parchment bg-white p-5 sm:p-8">
          <h2 className="font-display text-[1.3rem] leading-tight font-bold text-charcoal">Send a message</h2>
          <p className="mt-1 mb-6 text-sm text-ink-muted">We&apos;ll reply by email.</p>
          <ContactForm initialTopic={topic} />
        </div>
      </section>
    </>
  );
}
