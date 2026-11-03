"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/admin/auth";
import { invalidateAdmin } from "@/lib/admin/cache";
import {
  addContactNote,
  createCollection,
  createInvoice,
  deleteInvoice,
  deleteMedia,
  getContact,
  listCollections,
  listMedia,
  recordInvoicePayment,
  sendInvoice,
  uploadMedia,
  voidInvoice,
  createAppointment,
  createProduct,
  deleteAppointment,
  deleteProduct,
  savePrice,
  updateOpportunity,
  updateProduct,
  uploadImage,
  type OppStatus,
  contactNotes,
} from "@/lib/admin/data";
import { textToHtml } from "@/lib/admin/text";
import { GHL_TAG, resetGhlListing } from "@/lib/catalog/ghl";
import { CMS_TAG, getCmsFresh, saveCms } from "@/lib/cms";
import { normaliseCms, type CmsContent } from "@/lib/cms-types";
import { setReward } from "@/lib/customer/rewards";
import { CLAIM_STATUSES, orderMoney } from "@/lib/admin/claims";
import { CLAIM_UPDATE_PREFIX } from "@/lib/claims";
import { sendCustomerEmail } from "@/lib/customer/data";
import { refundPayment } from "@/lib/payments";
import { REFUND_PREFIX } from "@/lib/refund-notes";
import { formatInrExact } from "@/lib/site";
import { createRateLimiter } from "@/lib/webhook";

export interface ActionState {
  ok: boolean;
  message: string;
}

const str = (f: FormData, k: string, max = 5000) => String(f.get(k) ?? "").trim().slice(0, max);
const fail = (message: string): ActionState => ({ ok: false, message });
const errorText = (err: unknown) => (err instanceof Error ? err.message.replace(/\s*\{[\s\S]*$/, "") : "Something went wrong");

// ---------- Session ----------

const loginLimiter = createRateLimiter(6, 15 * 60 * 1000);

export async function loginAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (loginLimiter(ip)) return fail("Too many attempts. Please wait 15 minutes and try again.");
  const email = str(form, "email", 200);
  if (!checkCredentials(email, String(form.get("password") ?? ""))) return fail("Email or password is incorrect.");
  await startSession(email);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Orders & consultations ----------

export async function setStageAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 64);
  const stageId = str(form, "stageId", 64);
  if (id && stageId) await updateOpportunity(id, { pipelineStageId: stageId });
  invalidateAdmin();
  revalidatePath("/admin", "layout");
}

export async function setStatusAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 64);
  const status = str(form, "status", 20) as OppStatus;
  if (id && ["open", "won", "lost", "abandoned"].includes(status)) await updateOpportunity(id, { status });
  invalidateAdmin();
  revalidatePath("/admin", "layout");
}

/**
 * After a Gemstone Consultation: gives the customer the jewellery benefit (₹500 by
 * default) for the next 24 hours. It applies automatically at checkout.
 */
export async function grantBenefitAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  if (!contactId) return fail("No customer on this consultation.");
  try {
    const { store } = await getCmsFresh();
    const until = new Date(Date.now() + store.benefitHours * 3600e3);
    await setReward(contactId, "benefit", until.toISOString());
    const shown = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(until);
    await addContactNote(
      contactId,
      `🎁 Gemstone Consultation benefit: ₹${store.benefitAmount} off jewellery bought before ${shown}. Applied automatically at checkout (same email or phone).`,
    );
    invalidateAdmin();
    revalidatePath("/admin", "layout");
    return { ok: true, message: `Benefit active until ${shown}.` };
  } catch (err) {
    return fail(errorText(err));
  }
}

/** Damage claims: record the decision as a note on the customer's contact. */
export async function claimStatusAction(form: FormData) {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  const ref = str(form, "ref", 20);
  const status = str(form, "status", 30);
  const note = str(form, "note", 500);
  if (!contactId || !/^TRV-[A-Z0-9]+$/.test(ref) || !CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])) return;
  await addContactNote(contactId, `${CLAIM_UPDATE_PREFIX} ${ref}: ${status}${note ? ` — ${note}` : ""}`);
  invalidateAdmin();
  revalidatePath("/admin/claims");
}

/**
 * Damage claims: refund a custom amount (full or partial). Either sends the money
 * back through Razorpay, or just records a refund the team made another way. The
 * order amount and refunded amount stay separate, and the customer is emailed.
 */
export async function refundAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  const ref = str(form, "ref", 20);
  const method = str(form, "method", 20);
  const note = str(form, "note", 300);
  const amount = Math.round(Number(str(form, "amount", 12).replace(/[₹,\s]/g, "")) * 100) / 100;
  if (!contactId || !/^TRV-[A-Z0-9]+$/.test(ref)) return fail("This claim could not be read.");
  if (!(amount > 0)) return fail("Enter the amount to refund.");
  if (form.get("confirm") !== "yes") return fail("Tick the box to confirm the amount.");

  try {
    // Always worked out from the customer's latest notes, not from the page.
    const notes = await contactNotes(contactId);
    const money = orderMoney(notes, ref);
    if (money.orderTotal > 0 && amount > money.remaining) return fail(`Only ${formatInrExact(money.remaining)} is left to refund on this order.`);

    let via = "recorded by the team";
    if (method === "razorpay") {
      if (!money.paymentId) return fail("No Razorpay payment was found on this order. Refund it another way, then choose \"Already refunded\".");
      const refund = await refundPayment(money.paymentId, amount, `${ref} damaged item${note ? `: ${note}` : ""}`);
      if (!refund.ok) return fail(refund.message);
      via = `Razorpay ${refund.id}`;
    }
    await addContactNote(contactId, `${REFUND_PREFIX} ${ref}: ${formatInrExact(amount)}${money.orderTotal ? ` of ${formatInrExact(money.orderTotal)}` : ""} — ${via}${note ? ` — ${note}` : ""}`);

    // The refund has happened; a failed email mustn't report otherwise.
    const contact = await getContact(contactId);
    let emailed = false;
    if (contact?.email) {
      await sendCustomerEmail(
        contactId,
        contact.email,
        `Refund of ${formatInrExact(amount)} for your Ishmayi order ${ref}`,
        `<p>Hello ${(contact.name.split(" ")[0] || "there").replace(/[<>&]/g, "")},</p><p>We have processed a refund of <b>${formatInrExact(amount)}</b> for your order <b>${ref}</b>${money.orderTotal ? ` (order amount ${formatInrExact(money.orderTotal)})` : ""}.</p><p>It goes back to your original payment method. Your bank may take a few working days to show it.</p>`,
      )
        .then(() => (emailed = true))
        .catch(() => {});
    }
    invalidateAdmin();
    revalidatePath("/admin/claims");
    return { ok: true, message: `Refund of ${formatInrExact(amount)} recorded${method === "razorpay" ? " and sent through Razorpay" : ""}.${emailed ? " Customer emailed." : " The customer could not be emailed."}` };
  } catch (err) {
    return fail(errorText(err));
  }
}

export async function addNoteAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  const body = str(form, "body", 4000);
  if (!contactId || !body) return fail("Write a note first.");
  try {
    await addContactNote(contactId, `📝 Admin note\n\n${body}`);
  } catch (err) {
    return fail(errorText(err));
  }
  invalidateAdmin();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Note added." };
}

export async function scheduleAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  const calendarId = str(form, "calendarId", 64);
  const date = str(form, "date", 10);
  const time = str(form, "time", 5);
  const minutes = Math.min(240, Math.max(15, Number(str(form, "minutes", 4)) || 60));
  const title = str(form, "title", 120) || "Consultation";
  if (!contactId) return fail("Choose who the appointment is with.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return fail("Pick a date and time.");
  // Times are entered in India time.
  const start = new Date(`${date}T${time}:00+05:30`);
  if (Number.isNaN(start.getTime())) return fail("That date/time isn't valid.");
  try {
    await createAppointment({ calendarId, contactId, title, start, minutes, notes: str(form, "notes", 1000) });
    await addContactNote(contactId, `📅 Appointment booked: ${title} — ${date} ${time} IST (${minutes} min)`);
  } catch (err) {
    return fail(errorText(err));
  }
  invalidateAdmin();
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Booked for ${date} at ${time}. It's in the GHL calendar too.` };
}

export async function cancelAppointmentAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 64);
  if (id) await deleteAppointment(id);
  invalidateAdmin();
  revalidatePath("/admin", "layout");
}

// ---------- Products ----------

function refreshStore() {
  invalidateAdmin();
  // Expire cached GHL responses before the rebuild starts fetching, or it reads stale data.
  updateTag(GHL_TAG);
  resetGhlListing();
  // (no revalidatePath: its background rebuild can race with the tag expiry above)
}

const money = (v: string) => {
  const n = Number(v.replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

export async function saveProductAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "id", 64);
  const name = str(form, "name", 200);
  if (name.length < 2) return fail("Give the product a name.");
  const images = form.getAll("images").map(String).filter((u) => /^https:\/\//.test(u));
  try {
    for (const file of form.getAll("newImages")) {
      if (file instanceof File && file.size > 0) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return fail("Photos must be JPG, PNG or WebP.");
        if (file.size > 8 * 1024 * 1024) return fail("Each photo must be under 8 MB.");
        images.push(await uploadImage(file));
      }
    }
  } catch (err) {
    return fail(`Photo upload failed: ${errorText(err)}`);
  }
  const input = {
    name,
    description: textToHtml(str(form, "description", 20000)),
    availableInStore: form.get("availableInStore") === "on",
    collectionIds: form.getAll("collectionIds").map(String).filter(Boolean),
    images,
  };
  try {
    if (!id) {
      const amount = money(str(form, "amount", 20));
      if (!amount) return fail("Enter a price.");
      const newId = await createProduct(input, { amount, compareAtPrice: money(str(form, "compareAtPrice", 20)) });
      refreshStore();
      redirect(`/admin/products/${newId}?saved=1`);
    }
    await updateProduct(id, input);
    const priceIds = form.getAll("priceId").map(String);
    for (const [i, priceId] of priceIds.entries()) {
      const amount = money(String(form.getAll("priceAmount")[i] ?? ""));
      if (amount === null) return fail("Every price needs an amount.");
      const track = String(form.getAll("priceTrack")[i] ?? "") === "yes";
      await savePrice(id, priceId || null, {
        name: String(form.getAll("priceName")[i] ?? "").trim() || name,
        amount,
        compareAtPrice: money(String(form.getAll("priceCompare")[i] ?? "")),
        trackInventory: track,
        availableQuantity: track ? Math.max(0, Math.floor(Number(form.getAll("priceQty")[i] ?? 0) || 0)) : null,
      });
    }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err; // redirect()
    return fail(errorText(err));
  }
  refreshStore();
  invalidateAdmin();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved. The website updates within a few seconds." };
}

export async function deleteProductAction(form: FormData) {
  await requireAdmin();
  const id = str(form, "id", 64);
  if (id) await deleteProduct(id);
  refreshStore();
  redirect("/admin/products?deleted=1");
}

// ---------- Website content ----------

/** Saves part of the website content (banners, categories, settings…) and refreshes the site. */
export async function saveCmsAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  let patch: Record<string, unknown>;
  try {
    patch = JSON.parse(String(form.get("patch") ?? "{}"));
  } catch {
    return fail("The changes couldn't be read. Please reload and try again.");
  }
  const allowed: (keyof CmsContent)[] = ["announcement", "banners", "videos", "categories", "sections", "contact", "faqs", "reviews", "coupons", "pages", "nav", "policies", "store", "business", "seo", "social"];
  const keys = Object.keys(patch).filter((k): k is keyof CmsContent => (allowed as string[]).includes(k));
  if (!keys.length) return fail("Nothing to save.");
  try {
    const current = await getCmsFresh();
    const next = normaliseCms({ ...current, ...Object.fromEntries(keys.map((k) => [k, patch[k]])) });
    if (keys.includes("categories")) await ensureCollections(next.categories);
    await saveCms(next);
  } catch (err) {
    return fail(errorText(err));
  }
  updateTag(CMS_TAG);
  // Only category changes affect the store/admin product data.
  if (keys.includes("categories") || keys.includes("store")) refreshStore();
  // Pages are cached as a whole; expiring the catalogue tag too makes them rebuild
  // on the next visit. Product listings come from the in-memory listing, so this
  // costs only a few GHL calls (collections), not a full catalogue reload.
  else updateTag(GHL_TAG);
  // Tag expiry alone rebuilds every page on its next visit (revalidatePath would
  // add a background rebuild that can race with it and keep an older copy).
  return { ok: true, message: "Saved and published — the website shows it now." };
}

/** Every website category needs a GoHighLevel product collection with the same slug. */
async function ensureCollections(categories: CmsContent["categories"]) {
  const cols = await listCollections();
  for (const c of categories) {
    const exists = cols.some((x) => x.slug === c.handle || x.name.toLowerCase() === c.label.toLowerCase());
    if (!exists) await createCollection(c.label, c.handle);
  }
}

// ---------- Media library ----------

export async function listMediaAction(offset: number, kind: "image" | "video" | "all", query: string) {
  await requireAdmin();
  try {
    return { ok: true as const, ...(await listMedia({ offset: Math.max(0, Math.floor(offset) || 0), kind, query: query.slice(0, 60) })) };
  } catch (err) {
    return { ok: false as const, files: [], more: false, message: errorText(err) };
  }
}

export async function uploadMediaAction(form: FormData): Promise<{ ok: boolean; url?: string; message: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file first." };
  const isImage = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type);
  const isVideo = /^video\/(mp4|webm|quicktime)$/.test(file.type);
  if (!isImage && !isVideo) return { ok: false, message: "Use a JPG, PNG, WebP image or an MP4/WebM video." };
  if (file.size > 11.5 * 1024 * 1024)
    return { ok: false, message: "That file is over 11 MB. Upload big videos in GoHighLevel → Media Storage (they appear here), or use a YouTube link." };
  try {
    const url = await uploadMedia(file);
    invalidateAdmin();
    return { ok: true, url, message: "Uploaded." };
  } catch (err) {
    return { ok: false, message: `Upload failed: ${errorText(err)}` };
  }
}

export async function deleteMediaAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    await deleteMedia(id);
    return { ok: true, message: "Deleted." };
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

// ---------- Invoices ----------

export async function createInvoiceAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const contactId = str(form, "contactId", 64);
  const contact = contactId ? await getContact(contactId) : null;
  if (!contact) return fail("Choose the customer.");
  if (!contact.email) return fail("This customer has no email address — add one in GoHighLevel first.");
  let items: { name: string; description: string; qty: number; amount: number }[];
  try {
    items = (JSON.parse(String(form.get("items") ?? "[]")) as { name?: string; description?: string; qty?: number; amount?: number }[])
      .map((i) => ({ name: String(i.name ?? "").trim(), description: String(i.description ?? "").trim(), qty: Math.max(1, Math.floor(Number(i.qty) || 1)), amount: Math.round(Number(i.amount) * 100) / 100 }))
      .filter((i) => i.name && i.amount > 0);
  } catch {
    return fail("The items couldn't be read.");
  }
  if (!items.length) return fail("Add at least one item with a price.");
  const issueDate = str(form, "issueDate", 10);
  const dueDate = str(form, "dueDate", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || dueDate < issueDate) return fail("Check the invoice and due dates.");
  const { business } = await getCmsFresh();
  const notes = str(form, "terms", 3000);
  let id: string;
  try {
    id = await createInvoice({
      contact: { id: contact.id, name: contact.name || contact.email, email: contact.email, phone: contact.phone },
      name: str(form, "name", 120) || `Invoice for ${contact.name || contact.email}`,
      items,
      issueDate,
      dueDate,
      terms: [business.gstin ? `GSTIN: ${business.gstin}` : "", notes].filter(Boolean).join("\n"),
      business: { name: business.name, phone: business.phone, address: business.address },
    });
    if (form.get("send") === "yes") await sendInvoice(id);
  } catch (err) {
    return fail(errorText(err));
  }
  invalidateAdmin();
  redirect(`/admin/invoices/${id}?created=1`);
}

export async function invoiceAction(_: ActionState | undefined, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "id", 64);
  const op = str(form, "op", 20);
  try {
    if (op === "send") await sendInvoice(id);
    else if (op === "pay") {
      const amount = Math.round(Number(str(form, "amount", 20)) * 100) / 100;
      if (!(amount > 0)) return fail("Enter the amount received.");
      await recordInvoicePayment(id, amount, str(form, "mode", 20) || "cash", str(form, "notes", 300));
    } else if (op === "void") await voidInvoice(id);
    else if (op === "delete") {
      await deleteInvoice(id);
      invalidateAdmin();
      redirect("/admin/invoices?deleted=1");
    } else return fail("Unknown action.");
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return fail(errorText(err));
  }
  invalidateAdmin();
  revalidatePath(`/admin/invoices/${id}`);
  return { ok: true, message: op === "send" ? "Invoice emailed to the customer." : op === "pay" ? "Payment recorded." : "Invoice voided." };
}
