"use client";

import { useState } from "react";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  slugify,
  type BannerTone,
  type CategoryStatus,
  type CmsBanner,
  type CmsCategory,
  type CmsContent,
  type CmsTextReview,
  type CmsVideo,
  type CmsVideoReview,
} from "@/lib/cms-types";
import { CmsForm, ListControls, Panel, Text, Toggle, move, newId } from "./CmsForm";
import { MediaField } from "./media";
import { Badge, btn, input, label } from "./ui";

// ---------------- Banners ----------------

export function BannersEditor({ initial, categories }: { initial: CmsBanner[]; categories: { handle: string; label: string }[] }) {
  const [list, setList] = useState(initial);
  const upd = (i: number, p: Partial<CmsBanner>) => setList((cur) => cur.map((b, j) => (j === i ? { ...b, ...p } : b)));
  return (
    <CmsForm patch={{ banners: list }}>
      {list.map((b, i) => (
        <Panel
          key={b.id}
          title={`${i + 1}. ${`${b.title} ${b.highlight}`.trim() || "New banner"}`}
          sub={b.enabled ? "Showing on the home page" : "Hidden"}
          actions={<ListControls index={i} length={list.length} onMove={(to) => setList(move(list, i, to))} onRemove={() => setList(list.filter((_, j) => j !== i))} />}
        >
          <Toggle checked={b.enabled} onChange={(v) => upd(i, { enabled: v })} label="Show this banner" />
          <div className="grid gap-3 md:grid-cols-2">
            <Text id={`b${i}-eyebrow`} label="Small line above the title" value={b.eyebrow} onChange={(v) => upd(i, { eyebrow: v })} />
            <div>
              <label className={label} htmlFor={`b${i}-tone`}>
                Style
              </label>
              <select id={`b${i}-tone`} value={b.tone} onChange={(e) => upd(i, { tone: e.target.value as BannerTone })} className={input}>
                <option value="light">Light blush</option>
                <option value="dark">Dark burgundy</option>
                <option value="cream">Cream</option>
              </select>
            </div>
            <Text id={`b${i}-title`} label="Title" value={b.title} onChange={(v) => upd(i, { title: v })} />
            <Text id={`b${i}-hl`} label="Title — highlighted part" value={b.highlight} onChange={(v) => upd(i, { highlight: v })} />
          </div>
          <Text id={`b${i}-body`} label="Text" area value={b.body} onChange={(v) => upd(i, { body: v })} />
          <div className="grid gap-3 md:grid-cols-2">
            <Text id={`b${i}-cta`} label="Main button text" value={b.ctaLabel} onChange={(v) => upd(i, { ctaLabel: v })} />
            <Text id={`b${i}-ctah`} label="Main button link" value={b.ctaHref} onChange={(v) => upd(i, { ctaHref: v })} placeholder="/shop" />
            <Text id={`b${i}-sec`} label="Second button text (optional)" value={b.secondaryLabel} onChange={(v) => upd(i, { secondaryLabel: v })} />
            <Text id={`b${i}-sech`} label="Second button link" value={b.secondaryHref} onChange={(v) => upd(i, { secondaryHref: v })} placeholder="/about" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MediaField label="Banner photo" value={b.image} onChange={(v) => upd(i, { image: v })} hint="Portrait photos (4:5) look best." />
            <MediaField label="Banner video (optional)" kind="video" value={b.video} onChange={(v) => upd(i, { video: v })} hint="Short, silent MP4 — plays on loop instead of the photo." />
          </div>
          <div>
            <label className={label} htmlFor={`b${i}-from`}>
              No photo? Show products from
            </label>
            <select id={`b${i}-from`} value={b.productsFrom} onChange={(e) => upd(i, { productsFrom: e.target.value })} className={input}>
              <option value="">— artwork —</option>
              {categories.map((c) => (
                <option key={c.handle} value={c.handle}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </Panel>
      ))}
      <button
        type="button"
        onClick={() =>
          setList([
            ...list,
            { id: newId("banner"), enabled: true, eyebrow: "", title: "New banner", highlight: "", body: "", ctaLabel: "Shop now →", ctaHref: "/shop", secondaryLabel: "", secondaryHref: "", image: "", video: "", productsFrom: "", tone: "light" },
          ])
        }
        className={btn.outline}
      >
        + Add banner
      </button>
    </CmsForm>
  );
}

// ---------------- Promotional videos ----------------

export function VideosEditor({ initial }: { initial: CmsVideo[] }) {
  const [list, setList] = useState(initial);
  const upd = (i: number, p: Partial<CmsVideo>) => setList((cur) => cur.map((b, j) => (j === i ? { ...b, ...p } : b)));
  return (
    <CmsForm patch={{ videos: list }}>
      {list.length === 0 && <p className="text-sm text-ink-muted">No promotional videos yet. They appear on the home page in a “Watch &amp; Discover” section.</p>}
      {list.map((v, i) => (
        <Panel key={v.id} title={v.title || `Video ${i + 1}`} actions={<ListControls index={i} length={list.length} onMove={(to) => setList(move(list, i, to))} onRemove={() => setList(list.filter((_, j) => j !== i))} />}>
          <Toggle checked={v.enabled} onChange={(x) => upd(i, { enabled: x })} label="Show this video" />
          <div className="grid gap-3 md:grid-cols-2">
            <Text id={`v${i}-t`} label="Title" value={v.title} onChange={(x) => upd(i, { title: x })} />
            <Text id={`v${i}-c`} label="Caption" value={v.caption} onChange={(x) => upd(i, { caption: x })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MediaField label="Video (upload, or paste a YouTube link)" kind="video" value={v.url} onChange={(x) => upd(i, { url: x })} />
            <MediaField label="Cover image (optional)" value={v.poster} onChange={(x) => upd(i, { poster: x })} />
          </div>
        </Panel>
      ))}
      <button type="button" onClick={() => setList([...list, { id: newId("video"), enabled: true, title: "", caption: "", url: "", poster: "" }])} className={btn.outline}>
        + Add video
      </button>
    </CmsForm>
  );
}

// ---------------- Categories ----------------

export function CategoriesEditor({ initial, counts }: { initial: CmsCategory[]; counts: Record<string, number | null> }) {
  const [list, setList] = useState(initial);
  const [name, setName] = useState("");
  const upd = (i: number, p: Partial<CmsCategory>) => setList((cur) => cur.map((c, j) => (j === i ? { ...c, ...p } : c)));
  const add = () => {
    const label = name.trim();
    const handle = slugify(label);
    if (!label || !handle || list.some((c) => c.handle === handle)) return;
    setList([...list, { handle, label, blurb: "", status: "soon", image: "" }]);
    setName("");
  };
  return (
    <CmsForm patch={{ categories: list }}>
      <Panel title="Add a category" sub="Creates a matching product collection in GoHighLevel when you save. New categories start as “Coming soon”.">
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="e.g. Bangles" aria-label="New category name" className={`${input} max-w-sm`} />
          <button type="button" onClick={add} className={btn.outline}>
            + Add
          </button>
        </div>
      </Panel>
      {list.map((c, i) => (
        <Panel
          key={c.handle}
          title={c.label}
          sub={`/shop?collection=${c.handle} · ${counts[c.handle] ?? 0} products in GHL`}
          actions={
            <div className="flex items-center gap-2">
              <Badge status={c.status} />
              <ListControls index={i} length={list.length} onMove={(to) => setList(move(list, i, to))} onRemove={() => setList(list.filter((_, j) => j !== i))} />
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
            <Text id={`c${i}-l`} label="Name" value={c.label} onChange={(v) => upd(i, { label: v })} />
            <div>
              <label className={label} htmlFor={`c${i}-s`}>
                Status
              </label>
              <select id={`c${i}-s`} value={c.status} onChange={(e) => upd(i, { status: e.target.value as CategoryStatus })} className={input}>
                <option value="live">Live — on sale</option>
                <option value="soon">Coming soon</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          <Text id={`c${i}-b`} label="Short description" value={c.blurb} onChange={(v) => upd(i, { blurb: v })} />
          <MediaField label="Tile image" value={c.image} onChange={(v) => upd(i, { image: v })} hint="Empty = the first product photo in this category." />
        </Panel>
      ))}
    </CmsForm>
  );
}

// ---------------- Reviews ----------------

export function ReviewsEditor({ initial }: { initial: CmsContent["reviews"] }) {
  const [videos, setVideos] = useState<CmsVideoReview[]>(initial.videos);
  const [texts, setTexts] = useState<CmsTextReview[]>(initial.texts);
  const [tab, setTab] = useState<"videos" | "texts">("videos");
  const updV = (i: number, p: Partial<CmsVideoReview>) => setVideos((cur) => cur.map((v, j) => (j === i ? { ...v, ...p } : v)));
  const updT = (i: number, p: Partial<CmsTextReview>) => setTexts((cur) => cur.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <CmsForm patch={{ reviews: { videos, texts } }}>
      <div className="flex gap-1 rounded-xl bg-ivory-deep p-1 sm:w-fit">
        {(
          [
            ["videos", `Video reviews (${videos.length})`],
            ["texts", `Written reviews (${texts.length})`],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${tab === k ? "bg-[#e3425c] text-white" : "text-ink-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "videos" && (
        <>
          {videos.map((v, i) => (
            <Panel key={v.id} title={v.name || `Video review ${i + 1}`} sub={v.context} actions={<ListControls index={i} length={videos.length} onMove={(to) => setVideos(move(videos, i, to))} onRemove={() => setVideos(videos.filter((_, j) => j !== i))} />}>
              <Toggle checked={v.enabled} onChange={(x) => updV(i, { enabled: x })} label="Show on the website" />
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_8rem]">
                <Text id={`vr${i}-n`} label="Name (optional)" value={v.name} onChange={(x) => updV(i, { name: x })} placeholder="Shown as “Customer review” if empty" />
                <Text id={`vr${i}-c`} label="Subtitle / who they are" value={v.context} onChange={(x) => updV(i, { context: x })} />
                <div>
                  <label className={label} htmlFor={`vr${i}-d`}>
                    Length (sec)
                  </label>
                  <input id={`vr${i}-d`} inputMode="numeric" value={v.duration || ""} onChange={(e) => updV(i, { duration: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={input} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MediaField label="Video (MP4)" kind="video" value={v.src} onChange={(x) => updV(i, { src: x })} />
                <MediaField label="Cover image" value={v.poster} onChange={(x) => updV(i, { poster: x })} />
              </div>
            </Panel>
          ))}
          <button type="button" onClick={() => setVideos([...videos, { id: newId("vreview"), enabled: true, src: "", poster: "", duration: 0, name: "", context: "" }])} className={btn.outline}>
            + Add video review
          </button>
        </>
      )}

      {tab === "texts" && (
        <>
          {texts.map((t, i) => {
            const body = t.qa ? t.qa.map((x) => `${x.q}\n${x.a}`).join("\n\n") : (t.letter ?? []).join("\n\n");
            return (
              <Panel key={t.id} title={t.name || `Review ${i + 1}`} sub={[t.service, t.city].filter(Boolean).join(" · ")} actions={<ListControls index={i} length={texts.length} onMove={(to) => setTexts(move(texts, i, to))} onRemove={() => setTexts(texts.filter((_, j) => j !== i))} />}>
                <Toggle checked={t.enabled} onChange={(x) => updT(i, { enabled: x })} label="Show on the website" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Text id={`t${i}-n`} label="Name" value={t.name} onChange={(x) => updT(i, { name: x })} />
                  <Text id={`t${i}-c`} label="City (optional)" value={t.city ?? ""} onChange={(x) => updT(i, { city: x || undefined })} />
                  <Text id={`t${i}-r`} label="Title / role (optional)" value={t.role ?? ""} onChange={(x) => updT(i, { role: x || undefined })} />
                  <Text id={`t${i}-s`} label="Service tag" value={t.service} onChange={(x) => updT(i, { service: x })} placeholder="e.g. Numerology consultation" />
                </div>
                <Text id={`t${i}-h`} label="Highlight (shown on the card)" area rows={2} value={t.highlight} onChange={(x) => updT(i, { highlight: x })} />
                <Text
                  id={`t${i}-body`}
                  label={t.qa ? "Full review — question on one line, answer below, blank line between" : "Full review — blank line between paragraphs"}
                  area
                  rows={8}
                  value={body}
                  onChange={(x) => {
                    const blocks = x.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
                    if (t.qa) updT(i, { qa: blocks.map((b) => ({ q: b.split("\n")[0], a: b.split("\n").slice(1).join(" ").trim() })) });
                    else updT(i, { letter: blocks });
                  }}
                />
                {t.original && <p className="text-xs text-ink-muted">Also has the original {t.original.language} wording (kept as is).</p>}
              </Panel>
            );
          })}
          <button
            type="button"
            onClick={() => setTexts([...texts, { id: newId("review"), enabled: true, name: "", service: "Jewellery", highlight: "", letter: [] }])}
            className={btn.outline}
          >
            + Add written review
          </button>
        </>
      )}
    </CmsForm>
  );
}

// ---------------- Content (announcement, FAQs) ----------------

export function ContentEditor({ initial }: { initial: Pick<CmsContent, "announcement" | "faqs"> }) {
  const [announcement, setAnn] = useState(initial.announcement);
  const [faqs, setFaqs] = useState(initial.faqs);
  return (
    <CmsForm patch={{ announcement, faqs }}>
      <Panel title="Announcement bar" sub="A thin strip at the very top of every page — offers, launches, holidays.">
        <Toggle checked={announcement.enabled} onChange={(v) => setAnn((p_) => ({ ...p_, enabled: v }))} label="Show the announcement bar" />
        <div className="grid gap-3 md:grid-cols-2">
          <Text id="ann-text" label="Text" value={announcement.text} onChange={(v) => setAnn((announcement_) => ({ ...announcement_, text: v }))} placeholder="New arrivals are here" />
          <Text id="ann-link" label="Link (optional)" value={announcement.link} onChange={(v) => setAnn((announcement_) => ({ ...announcement_, link: v }))} placeholder="/shop?collection=necklaces" />
        </div>
      </Panel>

      <Panel title="FAQs" sub="Shown on the FAQs page, grouped by topic.">
        {faqs.map((g, gi) => {
          const updG = (patch: Partial<typeof g>) => setFaqs((cur) => cur.map((x, j) => (j === gi ? { ...x, ...patch } : x)));
          return (
            <div key={g.id} className="rounded-xl bg-ivory-deep p-4">
              <Text id={`g${gi}`} label="Topic" value={g.title} onChange={(v) => updG({ title: v })} />
              <ul className="mt-3 space-y-3">
                {g.items.map((f, fi) => (
                  <li key={fi} className="space-y-2 rounded-lg bg-panel p-3">
                    <input aria-label="Question" value={f.q} onChange={(e) => updG({ items: g.items.map((x, k) => (k === fi ? { ...x, q: e.target.value } : x)) })} className={`${input} font-semibold`} />
                    <textarea aria-label="Answer" rows={3} value={f.a} onChange={(e) => updG({ items: g.items.map((x, k) => (k === fi ? { ...x, a: e.target.value } : x)) })} className={input} />
                    <button type="button" onClick={() => updG({ items: g.items.filter((_, k) => k !== fi) })} className={`${btn.ghost} text-rose-300`}>
                      Remove question
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => updG({ items: [...g.items, { q: "", a: "" }] })} className={`${btn.outline} mt-3`}>
                + Add question
              </button>
            </div>
          );
        })}
      </Panel>
    </CmsForm>
  );
}

// ---------------- Settings ----------------

export function SettingsEditor({ initial, categories }: { initial: Pick<CmsContent, "store" | "business" | "seo" | "social" | "sections" | "contact">; categories: { handle: string; label: string }[] }) {
  const [store, setStore] = useState(initial.store);
  const [business, setBusiness] = useState(initial.business);
  const [seo, setSeo] = useState(initial.seo);
  const [social, setSocial] = useState(initial.social);
  const [sections, setSections] = useState(initial.sections);
  const [contact, setContact] = useState(initial.contact);
  const numberField = (id: string, l: string, v: number, on: (n: number) => void, hint?: string) => (
    <div>
      <label htmlFor={id} className={label}>
        {l}
      </label>
      <input id={id} inputMode="numeric" value={v} onChange={(e) => on(Number(e.target.value.replace(/\D/g, "")) || 0)} className={input} />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
  return (
    <CmsForm patch={{ store, business, seo, social, sections, contact }}>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Store" sub="Checkout, delivery and shipping.">
          <Toggle checked={store.ordersOpen} onChange={(v) => setStore((p_) => ({ ...p_, ordersOpen: v }))} label="Online ordering open" hint="Switch off to pause orders (holidays, stock-taking). The shop stays visible." />
          {!store.ordersOpen && (
            <Text id="closed-msg" label="Message shown at checkout while paused" area rows={2} value={store.closedMessage} onChange={(v) => setStore((p_) => ({ ...p_, closedMessage: v }))} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {numberField("ship-fee", "Shipping charge ₹", store.shippingFee, (n) => setStore((p_) => ({ ...p_, shippingFee: n })), "0 = free shipping on every order.")}
            {numberField("ship-free", "Free shipping from ₹", store.freeShippingAbove, (n) => setStore((p_) => ({ ...p_, freeShippingAbove: n })), "Orders at or above this ship free. 0 = never.")}
          </div>
          <Toggle checked={store.codEnabled} onChange={(v) => setStore((store_) => ({ ...store_, codEnabled: v }))} label="Cash on Delivery" hint="Customers can choose to pay when the order arrives." />
          <div className="grid gap-3 sm:grid-cols-2">
            {numberField("cod-max", "COD limit ₹", store.codMaxAmount, (n) => setStore((store_) => ({ ...store_, codMaxAmount: n })), "Orders above this must be paid online. 0 = no limit.")}
            <Text id="days" label="Delivery time (days)" value={store.deliveryDays} onChange={(v) => setStore((store_) => ({ ...store_, deliveryDays: v }))} placeholder="7–15" />
            {numberField("benefit", "Consultation benefit ₹", store.benefitAmount, (n) => setStore((store_) => ({ ...store_, benefitAmount: n })))}
            {numberField("benefit-h", "Benefit valid for (hours)", store.benefitHours, (n) => setStore((store_) => ({ ...store_, benefitHours: n })))}
          </div>
          <div>
            <label className={label} htmlFor="zodiac">
              Zodiac necklaces come from
            </label>
            <select id="zodiac" value={store.zodiacCategory} onChange={(e) => setStore((store_) => ({ ...store_, zodiacCategory: e.target.value }))} className={input}>
              {categories.map((c) => (
                <option key={c.handle} value={c.handle}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">A product with a sign’s name (e.g. “Leo”) links from that sign on the home page.</p>
          </div>
        </Panel>

        <Panel title="Contact details" sub="Footer, contact page, WhatsApp button.">
          <Toggle checked={store.whatsappButton} onChange={(v) => setStore((p_) => ({ ...p_, whatsappButton: v }))} label="Floating WhatsApp button" />
          <Text id="wa-msg" label="WhatsApp message (pre-filled)" value={store.whatsappMessage} onChange={(v) => setStore((p_) => ({ ...p_, whatsappMessage: v }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Text id="c-phone" label="Phone" value={contact.phone} onChange={(v) => setContact((contact_) => ({ ...contact_, phone: v }))} />
            <Text id="c-email" label="Email" value={contact.email} onChange={(v) => setContact((contact_) => ({ ...contact_, email: v }))} />
            <Text id="c-wa" label="WhatsApp (with country code)" value={contact.whatsapp} onChange={(v) => setContact((contact_) => ({ ...contact_, whatsapp: v.replace(/\D/g, "") }))} placeholder="918169735026" />
          </div>
        </Panel>

        <Panel title="Business & invoices" sub="Printed on invoices sent from the admin.">
          <Text id="bz-name" label="Business name" value={business.name} onChange={(v) => setBusiness((business_) => ({ ...business_, name: v }))} />
          <Text id="bz-addr" label="Address" area rows={2} value={business.address} onChange={(v) => setBusiness((business_) => ({ ...business_, address: v }))} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Text id="bz-phone" label="Phone" value={business.phone} onChange={(v) => setBusiness((business_) => ({ ...business_, phone: v }))} />
            <Text id="bz-gst" label="GSTIN (optional)" value={business.gstin} onChange={(v) => setBusiness((business_) => ({ ...business_, gstin: v }))} />
            {numberField("bz-due", "Payment due in (days)", business.dueDays, (n) => setBusiness((business_) => ({ ...business_, dueDays: n })))}
          </div>
          <Text id="bz-terms" label="Default invoice notes & terms" area rows={3} value={business.invoiceTerms} onChange={(v) => setBusiness((business_) => ({ ...business_, invoiceTerms: v }))} />
        </Panel>

        <Panel title="SEO & sharing" sub="How the site appears on Google and when shared on WhatsApp / social media.">
          <Text id="seo-t" label="Site title" value={seo.title} onChange={(v) => setSeo((seo_) => ({ ...seo_, title: v }))} />
          <Text id="seo-d" label="Description" area rows={2} value={seo.description} onChange={(v) => setSeo((seo_) => ({ ...seo_, description: v }))} />
          <MediaField label="Share image" value={seo.image} onChange={(v) => setSeo((seo_) => ({ ...seo_, image: v }))} hint="1200 × 630 works best." />
        </Panel>

        <Panel title="Social media" sub="Icons in the footer (leave empty to hide).">
          <Text id="so-ig" label="Instagram" value={social.instagram} onChange={(v) => setSocial((social_) => ({ ...social_, instagram: v }))} placeholder="https://instagram.com/…" />
          <Text id="so-fb" label="Facebook" value={social.facebook} onChange={(v) => setSocial((social_) => ({ ...social_, facebook: v }))} placeholder="https://facebook.com/…" />
          <Text id="so-yt" label="YouTube" value={social.youtube} onChange={(v) => setSocial((social_) => ({ ...social_, youtube: v }))} placeholder="https://youtube.com/@…" />
        </Panel>

        <Panel title="Home page sections" sub="Switch whole sections on or off.">
          <div className="grid gap-3 sm:grid-cols-2">
            {SECTION_KEYS.map((k) => (
              <Toggle key={k} checked={sections[k]} onChange={(v) => setSections((sections_) => ({ ...sections_, [k]: v }))} label={SECTION_LABELS[k]} />
            ))}
          </div>
        </Panel>
      </div>
    </CmsForm>
  );
}
