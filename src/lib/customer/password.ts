import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ghlApi, locationId } from "../ghl-api";

// Customer passwords without a database: a salted scrypt hash is kept in a
// hidden custom field on the customer's GoHighLevel contact. The password
// itself is never stored or logged.

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const FIELD_NAME = "Website Login (hashed)";
const KEY_LEN = 32;

export const PASSWORD_MIN = 8;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LEN);
  return `s1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function checkPassword(password: string, stored: string) {
  const [v, salt, hash] = stored.split("$");
  if (v !== "s1" || !salt || !hash) return false;
  const want = Buffer.from(hash, "base64url");
  const got = await scryptAsync(password, Buffer.from(salt, "base64url"), want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}

let fieldId: Promise<string> | null = null;

/** Id of the contact custom field holding the hash; created on first use. */
function passwordField() {
  fieldId ??= (async () => {
    const { customFields = [] } = await ghlApi<{ customFields?: { id: string; name: string }[] }>("GET", `/locations/${locationId()}/customFields`, {
      query: { model: "contact" },
    });
    const found = customFields.find((f) => f.name === FIELD_NAME);
    if (found) return found.id;
    const created = await ghlApi<{ customField?: { id: string } }>("POST", `/locations/${locationId()}/customFields`, {
      body: { name: FIELD_NAME, dataType: "TEXT", model: "contact", placeholder: "Set by the website — do not edit" },
    });
    if (!created.customField?.id) throw new Error("password field not created");
    return created.customField.id;
  })().catch((err) => {
    fieldId = null;
    throw err;
  });
  return fieldId;
}

/** The stored hash for this contact, or "" when no password has been set. */
export async function passwordHashFor(contactId: string) {
  const [id, res] = await Promise.all([
    passwordField(),
    ghlApi<{ contact?: { customFields?: { id: string; value?: unknown }[] } }>("GET", `/contacts/${contactId}`),
  ]);
  const value = res.contact?.customFields?.find((f) => f.id === id)?.value;
  return typeof value === "string" ? value : "";
}

export async function savePasswordHash(contactId: string, hash: string) {
  const id = await passwordField();
  await ghlApi("PUT", `/contacts/${contactId}`, { body: { customFields: [{ id, field_value: hash }] } });
}
