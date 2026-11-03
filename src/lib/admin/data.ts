import "server-only";
import { getCmsFresh } from "../cms";
import { ghlApi, locationId } from "../ghl-api";
import { memo } from "./cache";

// Everything the admin panel shows or changes lives in GoHighLevel:
//   orders & consultations → opportunities (cards) + the contact's notes
//   products → GHL products / prices / collections
//   calendar → GHL calendar appointments

// ---------- Opportunities (orders & consultation enquiries) ----------

export type OppKind = "order" | "consultation" | "other";
export type OppStatus = "open" | "won" | "lost" | "abandoned";

export interface Opportunity {
  id: string;
  name: string;
  kind: OppKind;
  value: number;
  status: OppStatus;
  stageId: string;
  pipelineId: string;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; name: string; email: string; phone: string };
  /** TRV-XXXXXX for orders. */
  reference: string | null;
  /** "COD" / "Paid" for orders; plan name for consultations. */
  detail: string;
}

interface RawOpp {
  id: string;
  name?: string;
  monetaryValue?: number;
  status?: string;
  pipelineStageId?: string;
  pipelineId?: string;
  createdAt?: string;
  updatedAt?: string;
  contactId?: string;
  contact?: { id?: string; name?: string; email?: string; phone?: string };
}

const kindOf = (name: string): OppKind => (name.startsWith("🛍") ? "order" : name.startsWith("🔮") ? "consultation" : "other");

function mapOpp(o: RawOpp): Opportunity {
  const name = o.name ?? "";
  const kind = kindOf(name);
  const parts = name.replace(/^\S+\s/, "").split(" · ");
  return {
    id: o.id,
    name,
    kind,
    value: o.monetaryValue ?? 0,
    status: (["open", "won", "lost", "abandoned"].includes(o.status ?? "") ? o.status : "open") as OppStatus,
    stageId: o.pipelineStageId ?? "",
    pipelineId: o.pipelineId ?? "",
    createdAt: o.createdAt ?? "",
    updatedAt: o.updatedAt ?? o.createdAt ?? "",
    contact: { id: o.contact?.id ?? o.contactId ?? "", name: o.contact?.name ?? "", email: o.contact?.email ?? "", phone: o.contact?.phone ?? "" },
    reference: name.match(/TRV-[A-Z0-9]+/)?.[0] ?? null,
    detail: kind === "order" ? (parts[1] ?? "") : kind === "consultation" ? (parts[0] ?? "") : "",
  };
}

/** Every website card (orders + consultations), newest first. */
async function listOpportunitiesRaw(): Promise<Opportunity[]> {
  const out: Opportunity[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await ghlApi<{ opportunities?: RawOpp[]; meta?: { nextPage?: number | null } }>("GET", "/opportunities/search", {
      query: { location_id: locationId(), limit: 100, page },
    });
    out.push(...(res.opportunities ?? []).map(mapOpp));
    if (!res.meta?.nextPage || (res.opportunities ?? []).length < 100) break;
  }
  return out.filter((o) => o.kind !== "other").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    const res = await ghlApi<{ opportunity?: RawOpp }>("GET", `/opportunities/${encodeURIComponent(id)}`);
    return res.opportunity ? mapOpp(res.opportunity) : null;
  } catch {
    return null;
  }
}

export async function updateOpportunity(id: string, patch: { pipelineStageId?: string; status?: OppStatus; monetaryValue?: number }) {
  await ghlApi("PUT", `/opportunities/${encodeURIComponent(id)}`, { body: patch });
}

export interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

async function listPipelinesRaw(): Promise<Pipeline[]> {
  const res = await ghlApi<{ pipelines?: Pipeline[] }>("GET", "/opportunities/pipelines", { query: { locationId: locationId() } });
  return (res.pipelines ?? []).map((p) => ({ id: p.id, name: p.name, stages: p.stages.map((s) => ({ id: s.id, name: s.name })) }));
}

// ---------- Contacts & notes ----------

export interface Note {
  id: string;
  body: string;
  dateAdded: string;
}

export async function contactNotes(contactId: string): Promise<Note[]> {
  const res = await ghlApi<{ notes?: Note[] }>("GET", `/contacts/${encodeURIComponent(contactId)}/notes`);
  return (res.notes ?? []).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
}

export const addContactNote = (contactId: string, body: string) =>
  ghlApi("POST", `/contacts/${encodeURIComponent(contactId)}/notes`, { body: { body } });

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  dateAdded: string;
  city: string;
}

interface RawContact {
  id: string;
  contactName?: string;
  firstNameRaw?: string;
  lastNameRaw?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  dateAdded?: string;
  city?: string;
}

const mapContact = (c: RawContact): Contact => ({
  id: c.id,
  name: [c.firstNameRaw ?? c.firstName, c.lastNameRaw ?? c.lastName].filter(Boolean).join(" ") || c.contactName || "",
  email: c.email ?? "",
  phone: c.phone ?? "",
  tags: c.tags ?? [],
  dateAdded: c.dateAdded ?? "",
  city: c.city ?? "",
});

/** Contacts carrying any of the given tags (website customers, enquiries, messages). */
async function contactsWithTagRaw(tag: string): Promise<Contact[]> {
  const out: Contact[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await ghlApi<{ contacts?: RawContact[]; total?: number }>("POST", "/contacts/search", {
      body: { locationId: locationId(), page, pageLimit: 100, filters: [{ field: "tags", operator: "contains", value: tag }], sort: [{ field: "dateAdded", direction: "desc" }] },
    });
    out.push(...(res.contacts ?? []).map(mapContact));
    if ((res.contacts ?? []).length < 100) break;
  }
  return out;
}

export async function getContact(id: string): Promise<Contact | null> {
  try {
    const res = await ghlApi<{ contact?: RawContact }>("GET", `/contacts/${encodeURIComponent(id)}`);
    return res.contact ? mapContact(res.contact) : null;
  } catch {
    return null;
  }
}

// ---------- Calendar ----------

export interface Calendar {
  id: string;
  name: string;
  teamMembers: string[];
}

export interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  contactId: string;
  calendarId: string;
}

async function listCalendarsRaw(): Promise<Calendar[]> {
  const res = await ghlApi<{ calendars?: { id: string; name: string; isActive?: boolean; teamMembers?: { userId: string }[] }[] }>("GET", "/calendars/", {
    query: { locationId: locationId() },
  });
  return (res.calendars ?? []).filter((c) => c.isActive !== false).map((c) => ({ id: c.id, name: c.name, teamMembers: (c.teamMembers ?? []).map((t) => t.userId) }));
}

export async function listAppointments(from: Date, to: Date): Promise<Appointment[]> {
  const calendars = await listCalendars();
  const all = await Promise.all(
    calendars.map((c) =>
      ghlApi<{ events?: { id: string; title?: string; startTime: string; endTime: string; appointmentStatus?: string; contactId?: string; calendarId: string }[] }>(
        "GET",
        "/calendars/events",
        { query: { locationId: locationId(), calendarId: c.id, startTime: from.getTime(), endTime: to.getTime() } },
      ).then((r) => r.events ?? []),
    ),
  );
  return all
    .flat()
    .map((e) => ({ id: e.id, title: e.title || "Appointment", start: e.startTime, end: e.endTime, status: e.appointmentStatus ?? "", contactId: e.contactId ?? "", calendarId: e.calendarId }))
    .sort((a, b) => a.start.localeCompare(b.start));
}

export async function createAppointment(opts: { calendarId: string; contactId: string; title: string; start: Date; minutes: number; notes?: string }) {
  const calendars = await listCalendars();
  const cal = calendars.find((c) => c.id === opts.calendarId);
  if (!cal) throw new Error("Calendar not found");
  await ghlApi("POST", "/calendars/events/appointments", {
    body: {
      calendarId: cal.id,
      locationId: locationId(),
      contactId: opts.contactId,
      title: opts.title,
      startTime: opts.start.toISOString(),
      endTime: new Date(opts.start.getTime() + opts.minutes * 60000).toISOString(),
      appointmentStatus: "confirmed",
      assignedUserId: cal.teamMembers[0],
      ignoreFreeSlotValidation: true,
      ignoreDateRange: true,
      ...(opts.notes ? { description: opts.notes } : {}),
    },
  });
}

export const deleteAppointment = (id: string) => ghlApi("DELETE", `/calendars/events/${encodeURIComponent(id)}`, { body: {} });

// ---------- Products ----------

export interface AdminPrice {
  id: string;
  name: string;
  amount: number;
  compareAtPrice: number | null;
  trackInventory: boolean;
  availableQuantity: number | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  availableInStore: boolean;
  collectionIds: string[];
  prices: AdminPrice[];
}

interface RawProduct {
  _id: string;
  name?: string;
  description?: string;
  image?: string;
  medias?: { id?: string; url?: string; type?: string; isFeatured?: boolean; title?: string }[];
  availableInStore?: boolean;
  collectionIds?: string[];
  productType?: string;
}
interface RawPrice {
  _id: string;
  name?: string;
  amount?: number;
  compareAtPrice?: number;
  trackInventory?: boolean;
  availableQuantity?: number;
  type?: string;
  currency?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
}

async function listCollectionsRaw(): Promise<Collection[]> {
  const res = await ghlApi<{ data?: { _id: string; name?: string; slug?: string }[] }>("GET", "/products/collections", {
    query: { altId: locationId(), altType: "location", limit: 100 },
  });
  return (res.data ?? []).map((c) => ({ id: c._id, name: c.name ?? "", slug: c.slug ?? "" }));
}

/** The site's categories (on sale + coming soon) with their GHL collection ids. */
export async function siteCollections() {
  const cols = await listCollections();
  const find = (handle: string, label: string) =>
    cols.find((c) => c.slug === handle || c.name.toLowerCase() === label.toLowerCase()) ?? null;
  return [
    ...(await getCmsFresh()).categories.map((c) => ({ ...c, onSale: c.status === "live", collection: find(c.handle, c.label) })),
  ];
}

export interface ProductRow {
  id: string;
  name: string;
  image: string;
  availableInStore: boolean;
  /** Site category labels this product is in. */
  categories: string[];
  onSale: boolean;
}

/** All GHL products with the site category each belongs to. */
async function listProductsRaw(): Promise<ProductRow[]> {
  const products: RawProduct[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const res = await ghlApi<{ products?: RawProduct[] }>("GET", "/products/", { query: { locationId: locationId(), limit: 100, offset } });
    products.push(...(res.products ?? []));
    if ((res.products ?? []).length < 100) break;
  }
  const cats = await siteCollections();
  const membership = new Map<string, { label: string; onSale: boolean }[]>();
  await Promise.all(
    cats.map(async (c) => {
      if (!c.collection) return;
      for (let offset = 0; offset < 2000; offset += 100) {
        const res = await ghlApi<{ products?: RawProduct[] }>("GET", "/products/", {
          query: { locationId: locationId(), limit: 100, offset, collectionIds: c.collection.id },
        });
        for (const p of res.products ?? []) membership.set(p._id, [...(membership.get(p._id) ?? []), { label: c.label, onSale: c.onSale }]);
        if ((res.products ?? []).length < 100) break;
      }
    }),
  );
  return products.map((p) => {
    const m = membership.get(p._id) ?? [];
    return {
      id: p._id,
      name: p.name ?? "Untitled",
      image: p.image ?? p.medias?.find((x) => x.url)?.url ?? "",
      availableInStore: p.availableInStore !== false,
      categories: m.map((x) => x.label),
      onSale: p.availableInStore !== false && m.some((x) => x.onSale),
    };
  });
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  let raw: RawProduct | undefined;
  try {
    const res = await ghlApi<RawProduct & { product?: RawProduct }>("GET", `/products/${encodeURIComponent(id)}`, { query: { locationId: locationId() } });
    raw = res.product ?? res;
  } catch {
    return null;
  }
  if (!raw?._id) return null;
  const prices = await ghlApi<{ prices?: RawPrice[] }>("GET", `/products/${encodeURIComponent(id)}/price`, { query: { locationId: locationId(), limit: 100 } });
  const images = [...(raw.medias ?? [])].filter((m) => m.url && (!m.type || m.type === "image")).map((m) => m.url!);
  if (raw.image && !images.includes(raw.image)) images.unshift(raw.image);
  return {
    id: raw._id,
    name: raw.name ?? "",
    description: raw.description ?? "",
    image: raw.image ?? images[0] ?? "",
    images,
    availableInStore: raw.availableInStore !== false,
    collectionIds: raw.collectionIds ?? [],
    prices: (prices.prices ?? [])
      .filter((p) => p.type !== "recurring")
      .map((p) => ({
        id: p._id,
        name: p.name ?? "Default",
        amount: p.amount ?? 0,
        compareAtPrice: p.compareAtPrice ?? null,
        trackInventory: p.trackInventory === true,
        availableQuantity: p.availableQuantity ?? null,
      })),
  };
}

export interface ProductInput {
  name: string;
  description: string;
  availableInStore: boolean;
  collectionIds: string[];
  images: string[];
}

const productBody = (p: ProductInput) => ({
  name: p.name,
  locationId: locationId(),
  description: p.description,
  productType: "PHYSICAL",
  availableInStore: p.availableInStore,
  image: p.images[0] ?? "",
  medias: p.images.map((url, i) => ({ id: `m${i}-${url.slice(-12).replace(/\W/g, "")}`, title: `${p.name} ${i + 1}`, url, type: "image", isFeatured: i === 0 })),
  collectionIds: p.collectionIds,
});

export async function createProduct(p: ProductInput, price: { amount: number; compareAtPrice: number | null }) {
  const res = await ghlApi<{ _id?: string; product?: { _id?: string } }>("POST", "/products/", { body: productBody(p) });
  const id = res._id ?? res.product?._id;
  if (!id) throw new Error("GHL did not return a product id");
  await savePrice(id, null, { name: p.name, ...price, trackInventory: false, availableQuantity: null });
  return id;
}

export const updateProduct = (id: string, p: ProductInput) => ghlApi("PUT", `/products/${encodeURIComponent(id)}`, { body: productBody(p) });

export const deleteProduct = (id: string) => ghlApi("DELETE", `/products/${encodeURIComponent(id)}`, { query: { locationId: locationId() } });

export async function savePrice(
  productId: string,
  priceId: string | null,
  p: { name: string; amount: number; compareAtPrice: number | null; trackInventory: boolean; availableQuantity: number | null },
) {
  const body = {
    product: productId,
    locationId: locationId(),
    name: p.name,
    type: "one_time",
    currency: "INR",
    amount: p.amount,
    ...(p.compareAtPrice && p.compareAtPrice > p.amount ? { compareAtPrice: p.compareAtPrice } : {}),
    trackInventory: p.trackInventory,
    ...(p.trackInventory ? { availableQuantity: p.availableQuantity ?? 0, allowOutOfStockPurchases: false } : {}),
  };
  if (priceId) await ghlApi("PUT", `/products/${encodeURIComponent(productId)}/price/${encodeURIComponent(priceId)}`, { body });
  else await ghlApi("POST", `/products/${encodeURIComponent(productId)}/price`, { body });
}

/** Uploads a photo to the GHL media library; returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file, file.name || "photo.jpg");
  form.set("name", (file.name || "photo").slice(0, 80));
  const res = await ghlApi<{ url?: string; fileId?: string }>("POST", "/medias/upload-file", { form });
  if (!res.url) throw new Error("Upload did not return a URL");
  return res.url;
}

export const listOpportunities = memo("listOpportunities", listOpportunitiesRaw);
export const listPipelines = memo("listPipelines", listPipelinesRaw);
export const contactsWithTag = memo("contactsWithTag", contactsWithTagRaw);
export const listCalendars = memo("listCalendars", listCalendarsRaw);
export const listCollections = memo("listCollections", listCollectionsRaw);
export const listProducts = memo("listProducts", listProductsRaw);
// ---------- Media library (GoHighLevel media storage) ----------

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  kind: "image" | "video" | "other";
  size: number;
  createdAt: string;
}

interface RawMedia {
  _id: string;
  name?: string;
  url?: string;
  contentType?: string;
  size?: number;
  createdAt?: string;
  type?: string;
}

const kindOfMedia = (ct = "", name = ""): MediaFile["kind"] =>
  ct.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif)$/i.test(name) ? "image" : ct.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(name) ? "video" : "other";

/** One page of the media library, newest first. */
export async function listMedia(opts: { offset?: number; kind?: "image" | "video" | "all"; query?: string } = {}): Promise<{ files: MediaFile[]; more: boolean }> {
  const limit = 60;
  const res = await ghlApi<{ files?: RawMedia[] }>("GET", "/medias/files", {
    query: {
      altId: locationId(),
      altType: "location",
      type: "file",
      limit,
      offset: opts.offset ?? 0,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(opts.query ? { query: opts.query } : {}),
    },
  });
  const raw = res.files ?? [];
  const files = raw
    .filter((f) => f.url)
    .map((f) => ({ id: f._id, name: f.name ?? "", url: f.url!, kind: kindOfMedia(f.contentType, f.name), size: f.size ?? 0, createdAt: f.createdAt ?? "" }))
    .filter((f) => !opts.kind || opts.kind === "all" || f.kind === opts.kind);
  return { files, more: raw.length === limit };
}

/** Uploads an image or video to the GHL media library; returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file, file.name || "upload");
  form.set("name", (file.name || "upload").slice(0, 80));
  const res = await ghlApi<{ url?: string; fileId?: string }>("POST", "/medias/upload-file", { form });
  if (!res.url) throw new Error("Upload did not return a URL");
  return res.url;
}

export const deleteMedia = (id: string) =>
  ghlApi("DELETE", `/medias/${encodeURIComponent(id)}`, { query: { altType: "location", altId: locationId() } });

// ---------- Invoices (GoHighLevel Invoices API) ----------

export interface InvoiceItem {
  name: string;
  description: string;
  qty: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  name: string;
  title: string;
  status: string;
  currency: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  contact: { id: string; name: string; email: string; phone: string };
  items: InvoiceItem[];
  /** Fixed discount in rupees, 0 if none. */
  discount: number;
  terms: string;
}

interface RawInvoice {
  _id: string;
  invoiceNumber?: string;
  invoiceNumberPrefix?: string;
  name?: string;
  title?: string;
  status?: string;
  currency?: string;
  total?: number;
  invoiceTotal?: number;
  amountPaid?: number;
  amountDue?: number;
  issueDate?: string;
  dueDate?: string;
  createdAt?: string;
  termsNotes?: string;
  contactDetails?: { id?: string; name?: string; email?: string; phoneNo?: string };
  invoiceItems?: { name?: string; description?: string; qty?: number; amount?: number }[];
  discount?: { value?: number; type?: string };
}

const mapInvoice = (r: RawInvoice): Invoice => ({
  id: r._id,
  number: `${r.invoiceNumberPrefix ?? "INV-"}${r.invoiceNumber ?? ""}`,
  name: r.name ?? "",
  title: r.title ?? "INVOICE",
  status: r.status ?? "draft",
  currency: r.currency ?? "INR",
  total: r.invoiceTotal ?? r.total ?? 0,
  amountPaid: r.amountPaid ?? 0,
  amountDue: r.amountDue ?? 0,
  issueDate: r.issueDate ?? "",
  dueDate: r.dueDate ?? "",
  createdAt: r.createdAt ?? "",
  contact: { id: r.contactDetails?.id ?? "", name: r.contactDetails?.name ?? "", email: r.contactDetails?.email ?? "", phone: r.contactDetails?.phoneNo ?? "" },
  items: (r.invoiceItems ?? []).map((i) => ({ name: i.name ?? "", description: i.description ?? "", qty: i.qty ?? 1, amount: i.amount ?? 0 })),
  discount: r.discount?.type === "fixed" ? (r.discount.value ?? 0) : 0,
  terms: r.termsNotes ?? "",
});

const loc = () => ({ altId: locationId(), altType: "location" as const });

async function listInvoicesRaw(): Promise<Invoice[]> {
  const out: Invoice[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const res = await ghlApi<{ invoices?: RawInvoice[]; total?: number }>("GET", "/invoices/", { query: { ...loc(), limit: 100, offset } });
    out.push(...(res.invoices ?? []).map(mapInvoice));
    if ((res.invoices ?? []).length < 100) break;
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const listInvoices = memo("listInvoices", listInvoicesRaw);

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    return mapInvoice(await ghlApi<RawInvoice>("GET", `/invoices/${encodeURIComponent(id)}`, { query: loc() }));
  } catch {
    return null;
  }
}

export interface NewInvoice {
  contact: { id: string; name: string; email: string; phone: string };
  name: string;
  items: InvoiceItem[];
  /** Fixed discount in rupees (shown on the invoice, taken off the total). */
  discount?: number;
  issueDate: string;
  dueDate: string;
  terms: string;
  business: { name: string; phone: string; address: string };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function createInvoice(inv: NewInvoice): Promise<string> {
  const res = await ghlApi<RawInvoice>("POST", "/invoices/", {
    body: {
      ...loc(),
      name: inv.name.slice(0, 120),
      title: "INVOICE",
      currency: "INR",
      items: inv.items.map((i) => ({ name: i.name.slice(0, 200), description: i.description.slice(0, 500), currency: "INR", amount: i.amount, qty: i.qty })),
      contactDetails: { id: inv.contact.id, name: inv.contact.name, email: inv.contact.email, phoneNo: inv.contact.phone },
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      ...(inv.terms ? { termsNotes: inv.terms.split(/\n+/).map((l) => `<p>${escapeHtml(l)}</p>`).join("") } : {}),
      businessDetails: {
        name: inv.business.name,
        ...(inv.business.phone ? { phoneNo: inv.business.phone } : {}),
        ...(inv.business.address ? { address: { addressLine1: inv.business.address.slice(0, 200), countryCode: "IN" } } : {}),
      },
      liveMode: true,
      discount: inv.discount ? { value: inv.discount, type: "fixed" } : { value: 0, type: "percentage" },
    },
  });
  return res._id;
}

/** Emails the invoice (with its payment link) to the customer from GHL. */
export async function sendInvoice(id: string) {
  const users = await ghlApi<{ users?: { id: string }[] }>("GET", "/users/", { query: { locationId: locationId() } });
  const userId = users.users?.[0]?.id;
  if (!userId) throw new Error("No GoHighLevel user found to send from");
  await ghlApi("POST", `/invoices/${encodeURIComponent(id)}/send`, { body: { ...loc(), userId, action: "email", liveMode: true } });
}

export const recordInvoicePayment = (id: string, amount: number, mode: string, notes: string) =>
  ghlApi("POST", `/invoices/${encodeURIComponent(id)}/record-payment`, { body: { ...loc(), mode, amount, notes: notes.slice(0, 300) } });

export const voidInvoice = (id: string) => ghlApi("POST", `/invoices/${encodeURIComponent(id)}/void`, { body: loc() });

export const deleteInvoice = (id: string) => ghlApi("DELETE", `/invoices/${encodeURIComponent(id)}`, { query: loc() });

export const createCollection = (name: string, slug: string) =>
  ghlApi("POST", "/products/collections", { body: { altId: locationId(), altType: "location", name, slug } });
