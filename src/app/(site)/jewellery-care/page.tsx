import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Jewellery Care",
  description: "How to look after stone, pearl, silver and fashion jewellery so it keeps looking its best.",
  alternates: { canonical: "/jewellery-care" },
};

const EVERYDAY = [
  "Put jewellery on last, after perfume, hairspray and make-up.",
  "Take it off before bathing, swimming, exercising or cleaning.",
  "Wipe each piece with a soft, dry cloth after wearing it.",
  "Store pieces separately in a dry pouch or box so they don't scratch or tangle.",
];

const GUIDES = [
  { title: "Natural stones", tips: ["Keep away from harsh chemicals and long spells of direct sunlight, which can fade some stones.", "Clean with a soft, slightly damp cloth, then dry straight away."] },
  { title: "Pearls", tips: ["Pearls are delicate, so avoid perfume and cosmetics on them.", "Wipe gently with a soft cloth and store them flat, apart from harder stones."] },
  { title: "Silver", tips: ["Silver darkens naturally with air and moisture; keep it in a closed pouch when not in use.", "Use a silver polishing cloth to bring back the shine."] },
  { title: "Fashion and antique-finish jewellery", tips: ["Keep dry: water and perfume can dull plating and antique finishes.", "Avoid polishes and cleaners, and wipe with a dry cloth only."] },
];

export default function JewelleryCarePage() {
  return (
    <>
      <PageHero eyebrow="Jewellery care" title="Keep your jewellery looking its best">
        <p>A little care goes a long way. These simple habits help your pieces last.</p>
      </PageHero>

      <section className="container-page max-w-4xl py-10 md:py-14">
        <div className="rounded-2xl bg-blush p-5 md:p-7">
          <h2 className="text-[1.3rem] font-bold text-charcoal">Everyday habits</h2>
          <ul className="mt-3 space-y-2.5 text-ink-muted">
            {EVERYDAY.map((t) => (
              <li key={t} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.title} className="rounded-2xl border border-parchment bg-white p-5 md:p-6">
              <h2 className="text-[1.1rem] font-bold text-charcoal">{g.title}</h2>
              <ul className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-ink-muted">
                {g.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ivory-deep p-6">
          <p className="text-[1.2rem] font-bold text-charcoal">Did a piece arrive damaged?</p>
          <Link href="/report-damage" className="btn btn-primary">Report a damaged parcel</Link>
        </div>
      </section>
    </>
  );
}
