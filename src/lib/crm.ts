import "server-only";
import { ghlConfigured } from "./catalog/ghl";

// GoHighLevel CRM helpers (contacts, tags, notes, opportunities). Used when no
// webhook is configured so enquiries, messages and orders still land in GHL.
// Token scopes: contacts.readonly/write, opportunities.readonly/write.

const env = (k: string) => process.env[k]?.trim() ?? "";
const API = "https://services.leadconnectorhq.com";
const headers = () => ({
  Authorization: `Bearer ${env("GHL_PRIVATE_TOKEN")}`,
  Version: "2021-07-28",
  Accept: "application/json",
  "Content-Type": "application/json",
});

export const crmAvailable = ghlConfigured;

async function post<T>(path: string, body: object, method: "POST" | "PUT" = "POST"): Promise<T> {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API + path, { method, headers: headers(), body: JSON.stringify(body), signal: AbortSignal.timeout(15000), cache: "no-store" });
      const text = await res.text();
      if (res.status === 429 || res.status >= 500) {
        lastError = `${path} → ${res.status}`;
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`${path} → ${res.status} ${text.slice(0, 400)}`);
      return JSON.parse(text) as T;
    } catch (err) {
      // Network blips (ECONNRESET etc.) are retried; real API errors are not.
      if (err instanceof Error && err.message.startsWith(path)) throw err;
      lastError = err instanceof Error ? err.message : "network error";
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw new Error(lastError || `${path} failed`);
}

export interface ContactFields {
  fullName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source: string;
}

/** Create or update the contact (matched by email / phone). Returns the contact id. */
export async function upsertContact(c: ContactFields): Promise<string> {
  const [firstName, ...rest] = c.fullName.trim().split(/\s+/);
  const res = await post<{ contact?: { id?: string } }>("/contacts/upsert", {
    locationId: env("GHL_LOCATION_ID"),
    firstName,
    lastName: rest.join(" ") || undefined,
    name: c.fullName,
    email: c.email,
    ...(c.phone ? { phone: c.phone } : {}),
    ...(c.dateOfBirth ? { dateOfBirth: c.dateOfBirth } : {}),
    ...(c.address1 ? { address1: c.address1 } : {}),
    ...(c.city ? { city: c.city } : {}),
    ...(c.state ? { state: c.state } : {}),
    ...(c.postalCode ? { postalCode: c.postalCode, country: "IN" } : {}),
    source: c.source,
  });
  const id = res.contact?.id;
  if (!id) throw new Error("contact upsert returned no id");
  return id;
}

/** Updates a known contact (a signed-in customer), so their order stays on their account. */
export const updateContact = (contactId: string, fields: { phone?: string; address1?: string; city?: string; state?: string; postalCode?: string }) =>
  post(`/contacts/${contactId}`, fields, "PUT");

/** Adds tags without removing the contact's existing ones. */
export const addTags = (contactId: string, tags: string[]) => post(`/contacts/${contactId}/tags`, { tags });

export const addNote = (contactId: string, body: string) => post(`/contacts/${contactId}/notes`, { body });

interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
}

/** Pipeline chosen by env id, else by name pattern, else the first pipeline. */
async function pipelineFor(match: RegExp, idEnv: string, stageEnv: string) {
  const res = await fetch(`${API}/opportunities/pipelines?locationId=${env("GHL_LOCATION_ID")}`, {
    headers: headers(),
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`pipelines → ${res.status}`);
  const pipelines = ((await res.json()) as { pipelines?: Pipeline[] }).pipelines ?? [];
  const p = pipelines.find((x) => x.id === env(idEnv)) ?? pipelines.find((x) => match.test(x.name)) ?? pipelines[0];
  if (!p?.stages.length) throw new Error("no pipeline");
  return { pipelineId: p.id, stageId: (p.stages.find((s) => s.id === env(stageEnv)) ?? p.stages[0]).id };
}

/** A card on a pipeline board (best effort — callers shouldn't fail if this does). */
export async function createOpportunity(opts: {
  contactId: string;
  name: string;
  value: number;
  pipeline: "orders" | "consultations";
}) {
  const target =
    opts.pipeline === "orders"
      ? await pipelineFor(/order/i, "GHL_ORDER_PIPELINE_ID", "GHL_ORDER_STAGE_ID")
      : await pipelineFor(/consult|booking|enquir/i, "GHL_CONSULTATION_PIPELINE_ID", "GHL_CONSULTATION_STAGE_ID");
  const card = {
    pipelineId: target.pipelineId,
    pipelineStageId: target.stageId,
    name: opts.name.slice(0, 250),
    status: "open",
    monetaryValue: opts.value,
  };
  try {
    await post("/opportunities/", { ...card, locationId: env("GHL_LOCATION_ID"), contactId: opts.contactId, source: "Trivana website" });
  } catch (err) {
    // GHL allows one card per contact per pipeline (unless duplicates are enabled in its
    // settings): a returning customer's card is updated and moved back to the first stage.
    const existing = err instanceof Error ? err.message.match(/OPPORTUNITY_NO_DUPLICATE[\s\S]*?"existingId":"([^"]+)"/)?.[1] : undefined;
    if (!existing) throw err;
    await post(`/opportunities/${existing}`, card, "PUT");
  }
}
