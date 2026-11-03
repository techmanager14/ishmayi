"use client";

import { useState } from "react";
import { HEADING_KEYS, POLICY_KEYS, type CmsContent, type CmsCoupon, type HeadingKey, type PolicyKey } from "@/lib/cms-types";
import { CmsForm, ListControls, Panel, Text, Toggle, move } from "./CmsForm";
import { btn, input, label } from "./ui";

// ---------------- Pages & text ----------------

const HEADING_LABELS: Record<HeadingKey, string> = {
  categories: "Home · Featured categories",
  offers: "Offers · Offers & discounts",
  limited: "Offers · Limited-time offers",
  featured: "Offers · Featured products",
  collections: "Explore · By collection",
  gemstones: "Explore · By gemstone",
  styles: "Explore · By style",
  faqs: "FAQs",
};

type Item = { title: string; body: string };

function ItemList({ items, onChange, noun }: { items: Item[]; onChange: (next: (cur: Item[]) => Item[]) => void; noun: string }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl bg-ivory-deep p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-ink-muted">
              {noun} {i + 1}
            </span>
            <ListControls index={i} length={items.length} onMove={(to) => onChange((x) => move(x, i, to))} onRemove={() => onChange((x) => x.filter((_, j) => j !== i))} />
          </div>
          <input aria-label={`${noun} ${i + 1} title`} value={it.title} onChange={(e) => onChange((x) => x.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))} className={`${input} font-semibold`} />
          <textarea aria-label={`${noun} ${i + 1} text`} rows={2} value={it.body} onChange={(e) => onChange((x) => x.map((y, j) => (j === i ? { ...y, body: e.target.value } : y)))} className={input} />
        </div>
      ))}
      <button type="button" onClick={() => onChange((x) => [...x, { title: "", body: "" }])} className={btn.outline}>
        + Add {noun.toLowerCase()}
      </button>
    </div>
  );
}

const joinParas = (v: string[]) => v.join("\n\n");
const splitParas = (v: string) =>
  v
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export function PagesEditor({ initial }: { initial: CmsContent["pages"] }) {
  const [pages, setPages] = useState(initial);
  const setBrand = (p: Partial<CmsContent["pages"]["brand"]>) => setPages((x) => ({ ...x, brand: { ...x.brand, ...p } }));
  const setHeading = (k: HeadingKey, p: Partial<{ title: string; sub: string }>) => setPages((x) => ({ ...x, headings: { ...x.headings, [k]: { ...x.headings[k], ...p } } }));
  const setAbout = (p: Partial<CmsContent["pages"]["about"]>) => setPages((x) => ({ ...x, about: { ...x.about, ...p } }));
  // Paragraph fields keep the raw text while typing; split into paragraphs on save.
  const [storyText, setStoryText] = useState(joinParas(initial.about.story));
  const patch = { pages: { ...pages, about: { ...pages.about, story: splitParas(storyText) } } };

  return (
    <CmsForm patch={patch}>
      <Panel title="Brand lines" sub="Used on the About page and in the footer.">
        <Text id="pg-tag" label="Tagline" value={pages.brand.tagline} onChange={(v) => setBrand({ tagline: v })} />
        <Text id="pg-prom" label="Promise" value={pages.brand.promise} onChange={(v) => setBrand({ promise: v })} />
        <Text id="pg-ess" label="Short brand line" area rows={2} value={pages.brand.essence} onChange={(v) => setBrand({ essence: v })} />
      </Panel>
      <Panel title="Section titles" sub="Title and the short line under it, for each section.">
        <div className="grid gap-3 lg:grid-cols-2">
          {HEADING_KEYS.map((k) => (
            <div key={k} className="space-y-2 rounded-xl bg-ivory-deep p-3">
              <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">{HEADING_LABELS[k]}</p>
              <input aria-label={`${HEADING_LABELS[k]} title`} value={pages.headings[k].title} onChange={(e) => setHeading(k, { title: e.target.value })} className={`${input} font-semibold`} />
              <textarea aria-label={`${HEADING_LABELS[k]} text`} rows={2} value={pages.headings[k].sub} onChange={(e) => setHeading(k, { sub: e.target.value })} className={input} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Brand pillars" sub="The cards on the About page.">
        <ItemList noun="Pillar" items={pages.pillars} onChange={(fn) => setPages((x) => ({ ...x, pillars: fn(x.pillars) }))} />
      </Panel>
      <Panel title="About page">
        <div className="grid gap-3 md:grid-cols-2">
          <Text id="ab-t" label="Page title" value={pages.about.title} onChange={(v) => setAbout({ title: v })} />
          <Text id="ab-i" label="Intro line" value={pages.about.intro} onChange={(v) => setAbout({ intro: v })} />
          <Text id="ab-st" label="Story heading" value={pages.about.storyTitle} onChange={(v) => setAbout({ storyTitle: v })} />
        </div>
        <Text id="ab-s" label="Our story (blank line between paragraphs)" area rows={10} value={storyText} onChange={setStoryText} />
      </Panel>
    </CmsForm>
  );
}

// ---------------- Menu ----------------

export function NavEditor({ initial }: { initial: CmsContent["nav"] }) {
  const [nav, setNav] = useState(initial);
  return (
    <CmsForm patch={{ nav }}>
      <Panel title="Main menu" sub="Links in the header menu (phones) and the footer. Shop categories are added automatically.">
        {nav.map((n, i) => (
          <div key={i} className="grid gap-2 rounded-xl bg-ivory-deep p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
            <input aria-label={`Link ${i + 1} label`} value={n.label} onChange={(e) => setNav((x) => x.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} className={input} placeholder="Label" />
            <input aria-label={`Link ${i + 1} address`} value={n.href} onChange={(e) => setNav((x) => x.map((y, j) => (j === i ? { ...y, href: e.target.value } : y)))} className={input} placeholder="/about or https://…" />
            <ListControls index={i} length={nav.length} onMove={(to) => setNav((x) => move(x, i, to))} onRemove={() => setNav((x) => x.filter((_, j) => j !== i))} />
          </div>
        ))}
        <button type="button" onClick={() => setNav((x) => [...x, { label: "", href: "/" }])} className={btn.outline}>
          + Add link
        </button>
        <p className="text-xs text-ink-muted">Pages: /, /shop, /offers, /explore, /about, /faqs, /contact, /wishlist.</p>
      </Panel>
    </CmsForm>
  );
}

// ---------------- Policies ----------------

const POLICY_LABELS: Record<PolicyKey, string> = { privacy: "Privacy notice", terms: "Terms of use", shipping: "Shipping policy", refund: "Cancellation & refunds" };

export function PoliciesEditor({ initial }: { initial: CmsContent["policies"] }) {
  const [policies, setPolicies] = useState(initial);
  return (
    <CmsForm patch={{ policies }}>
      {POLICY_KEYS.map((k) => (
        <Panel key={k} title={POLICY_LABELS[k]} sub={policies[k].trim() ? "Showing your text below." : "Showing the built-in policy — write here to replace it."}>
          <textarea
            aria-label={POLICY_LABELS[k]}
            rows={10}
            value={policies[k]}
            onChange={(e) => {
              const v = e.target.value;
              setPolicies((x) => ({ ...x, [k]: v }));
            }}
            className={`${input} font-mono text-sm`}
            placeholder={"## Heading\n\nA paragraph of text.\n\n- A bullet point\n- Another one, with **bold** words"}
          />
        </Panel>
      ))}
      <p className="text-xs text-ink-muted">Formatting: “## ” for a heading, “- ” for bullet points, **double stars** for bold, and a blank line between paragraphs.</p>
    </CmsForm>
  );
}

// ---------------- Discount codes ----------------

export function CouponsEditor({ initial }: { initial: CmsCoupon[] }) {
  const [list, setList] = useState(initial);
  const upd = (i: number, p: Partial<CmsCoupon>) => setList((cur) => cur.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <CmsForm patch={{ coupons: list }}>
      {list.length === 0 && <p className="text-sm text-ink-muted">No discount codes yet. Customers enter codes at checkout; the discount is checked and applied on the server.</p>}
      {list.map((c, i) => (
        <Panel
          key={i}
          title={c.code || "New code"}
          sub={c.active ? `${c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}${c.minOrder ? ` · min ₹${c.minOrder}` : ""}${c.expires ? ` · until ${c.expires}` : ""}` : "Inactive"}
          actions={<ListControls index={i} length={list.length} onMove={(to) => setList((x) => move(x, i, to))} onRemove={() => setList((x) => x.filter((_, j) => j !== i))} removeLabel="Delete" />}
        >
          <Toggle checked={c.active} onChange={(v) => upd(i, { active: v })} label="Active" />
          <Toggle checked={c.showOnOffers} onChange={(v) => upd(i, { showOnOffers: v })} label="Show this code publicly on the Offers page" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={label} htmlFor={`cp${i}-code`}>
                Code
              </label>
              <input id={`cp${i}-code`} value={c.code} onChange={(e) => upd(i, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} className={`${input} uppercase`} placeholder="WELCOME10" />
            </div>
            <div>
              <label className={label} htmlFor={`cp${i}-type`}>
                Type
              </label>
              <select id={`cp${i}-type`} value={c.type} onChange={(e) => upd(i, { type: e.target.value as CmsCoupon["type"] })} className={input}>
                <option value="percent">% off</option>
                <option value="flat">₹ off</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor={`cp${i}-val`}>
                {c.type === "percent" ? "Percent" : "Amount ₹"}
              </label>
              <input id={`cp${i}-val`} inputMode="decimal" value={c.value || ""} onChange={(e) => upd(i, { value: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} className={input} />
            </div>
            <div>
              <label className={label} htmlFor={`cp${i}-min`}>
                Min. order ₹
              </label>
              <input id={`cp${i}-min`} inputMode="numeric" value={c.minOrder || ""} onChange={(e) => upd(i, { minOrder: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={input} placeholder="0" />
            </div>
            <div>
              <label className={label} htmlFor={`cp${i}-exp`}>
                Valid until
              </label>
              <input id={`cp${i}-exp`} type="date" value={c.expires} onChange={(e) => upd(i, { expires: e.target.value })} className={input} />
            </div>
          </div>
          <Text id={`cp${i}-note`} label="Note (only you see this)" value={c.note} onChange={(v) => upd(i, { note: v })} placeholder="e.g. Diwali offer" />
        </Panel>
      ))}
      <button type="button" onClick={() => setList((x) => [...x, { code: "", type: "percent", value: 10, minOrder: 0, active: true, showOnOffers: false, expires: "", note: "" }])} className={btn.outline}>
        + New discount code
      </button>
    </CmsForm>
  );
}
