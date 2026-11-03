import "server-only";
import { ghlApi, locationId } from "../ghl-api";

// Customer rewards without a database: each one is a date ("valid until",
// YYYY-MM-DD or an ISO time) kept in a custom field on the customer's
// GoHighLevel contact, so the team can also see and edit it in GHL.
//   • Loyalty — spend over the threshold on jewellery → % off the next order within N days.
//   • Gemstone benefit — ₹ off jewellery bought within 24 h of a completed Gemstone Consultation.

const FIELDS = {
  loyalty: "Website Reward: Loyalty valid until",
  benefit: "Website Reward: Gemstone benefit valid until",
} as const;
export type RewardKind = keyof typeof FIELDS;

let fieldIds: Promise<Record<RewardKind, string>> | null = null;

/** Ids of the two reward fields; created in GHL on first use. */
function rewardFields() {
  fieldIds ??= (async () => {
    const { customFields = [] } = await ghlApi<{ customFields?: { id: string; name: string }[] }>("GET", `/locations/${locationId()}/customFields`, {
      query: { model: "contact" },
    });
    const out = {} as Record<RewardKind, string>;
    for (const [kind, name] of Object.entries(FIELDS) as [RewardKind, string][]) {
      const found = customFields.find((f) => f.name === name);
      if (found) out[kind] = found.id;
      else {
        const created = await ghlApi<{ customField?: { id: string } }>("POST", `/locations/${locationId()}/customFields`, {
          body: { name, dataType: "TEXT", model: "contact", placeholder: "Set by the website (YYYY-MM-DD) — empty = no reward" },
        });
        if (!created.customField?.id) throw new Error(`reward field "${name}" not created`);
        out[kind] = created.customField.id;
      }
    }
    return out;
  })().catch((err) => {
    fieldIds = null;
    throw err;
  });
  return fieldIds;
}

export interface Rewards {
  contactId: string;
  /** Valid-until values still in the future (ISO / YYYY-MM-DD), or null. */
  loyalty: string | null;
  benefit: string | null;
}

/** End of a valid-until value: a bare date lasts to the end of that day (IST). */
const endOf = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.parse(`${v}T23:59:59+05:30`) : Date.parse(v));
const live = (v: unknown) => (typeof v === "string" && v.trim() && endOf(v.trim()) > Date.now() ? v.trim() : null);

/** The customer's active rewards, looked up by email (then phone). Null if they have no contact yet. */
export async function rewardsFor(who: { email?: string; phone?: string }): Promise<Rewards | null> {
  const filters = who.email
    ? [{ field: "email", operator: "eq", value: who.email.toLowerCase() }]
    : who.phone
      ? [{ field: "phone", operator: "eq", value: who.phone }]
      : null;
  if (!filters) return null;
  const [ids, res] = await Promise.all([
    rewardFields(),
    ghlApi<{ contacts?: { id: string }[] }>("POST", "/contacts/search", { body: { locationId: locationId(), pageLimit: 1, filters } }),
  ]);
  const id = res.contacts?.[0]?.id;
  if (!id) return null;
  return rewardsForContact(id, ids);
}

/** Active rewards of a known contact. */
export async function rewardsForContact(contactId: string, known?: Record<RewardKind, string>): Promise<Rewards> {
  const [ids, res] = await Promise.all([
    known ?? rewardFields(),
    ghlApi<{ contact?: { customFields?: { id: string; value?: unknown }[] } }>("GET", `/contacts/${encodeURIComponent(contactId)}`),
  ]);
  const value = (kind: RewardKind) => res.contact?.customFields?.find((f) => f.id === ids[kind])?.value;
  return { contactId, loyalty: live(value("loyalty")), benefit: live(value("benefit")) };
}

/** Sets (or clears, with "") a reward's valid-until value on a contact. */
export async function setReward(contactId: string, kind: RewardKind, validUntil: string) {
  const ids = await rewardFields();
  await ghlApi("PUT", `/contacts/${encodeURIComponent(contactId)}`, { body: { customFields: [{ id: ids[kind], field_value: validUntil }] } });
}

/** YYYY-MM-DD in India, `days` from now. */
export const dateInDays = (days: number) => new Date(Date.now() + 5.5 * 3600e3 + days * 86400e3).toISOString().slice(0, 10);
