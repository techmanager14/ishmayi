import { CONTACT_TOPICS, validateContact } from "@/lib/contact";
import { addNote, addTags, crmAvailable, upsertContact } from "@/lib/crm";
import { contactWebhook, createRelay } from "@/lib/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MessagePayload {
  customer: { fullName: string; email: string; phone: string | null };
  message: { topic: string; body: string };
}

/** Without a webhook, the message goes straight into GoHighLevel. */
async function saveToCrm(raw: Record<string, unknown>) {
  const p = raw as unknown as MessagePayload;
  const contactId = await upsertContact({
    fullName: p.customer.fullName,
    email: p.customer.email,
    phone: p.customer.phone,
    source: "Trivana website — contact form",
  });
  await addTags(contactId, ["website-contact"]);
  const topic = CONTACT_TOPICS.find((t) => t.value === p.message.topic)?.label ?? p.message.topic;
  await addNote(
    contactId,
    [`✉️ Website message — ${topic}`, "", p.message.body, "", `Reply to: ${p.customer.email}${p.customer.phone ? ` · ${p.customer.phone}` : ""}`].join("\n"),
  );
  return contactId;
}

export const POST = createRelay({
  name: "contact",
  system: "message service",
  config: contactWebhook,
  fallback: { available: crmAvailable, save: saveToCrm },
  build: (input, submissionId) => {
    const result = validateContact(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    const { data } = result;
    return {
      ok: true,
      payload: {
        event: "contact.message_submitted",
        source: "trivana_website",
        submissionId,
        submittedAt: new Date().toISOString(),
        customer: { fullName: data.name, email: data.email, phone: data.phone },
        message: { topic: data.topic, body: data.message },
        consent: { privacyNoticeAccepted: true },
      },
    };
  },
});
