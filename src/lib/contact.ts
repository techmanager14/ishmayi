// Contact form rules, shared by the browser form and the /api/contact relay.

import { normalisePhone } from "./enquiry";

export const CONTACT_TOPICS = [
  { value: "order", label: "An existing order" },
  { value: "product", label: "A product question" },
  { value: "bulk", label: "Bulk order enquiry" },
  { value: "gift", label: "Customised gift set" },
  { value: "shipping", label: "Shipping & delivery" },
  { value: "other", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  privacyNoticeAccepted: boolean;
}

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export const emptyContact: ContactInput = { name: "", email: "", phone: "", topic: "order", message: "", privacyNoticeAccepted: false };

const text = (value: unknown, max: number, keepLines = false) =>
  typeof value === "string"
    ? (keepLines
        ? value.replace(/[\u0000-\u0009\u000b-\u001f\u007f<>]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
        : value.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ")
      )
        .trim()
        .slice(0, max)
    : "";

export const MESSAGE_MAX = 1000;

export function validateContact(input: Partial<Record<keyof ContactInput, unknown>>):
  | { ok: true; data: { name: string; email: string; phone: string | null; topic: ContactTopic; message: string } }
  | { ok: false; errors: ContactErrors } {
  const errors: ContactErrors = {};

  const name = text(input.name, 100);
  if (name.length < 2) errors.name = "Please enter your name.";

  const email = text(input.email, 254).toLowerCase();
  if (!email) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Please enter a valid email address.";

  const rawPhone = text(input.phone, 25);
  const phone = rawPhone ? normalisePhone(rawPhone) : null;
  if (rawPhone && !phone) errors.phone = "Please enter a valid mobile number, or leave it blank.";

  const topic = text(input.topic, 30);
  if (!CONTACT_TOPICS.some((t) => t.value === topic)) errors.topic = "Please choose a topic.";

  const message = text(input.message, MESSAGE_MAX, true);
  if (message.length < 10) errors.message = "Please write a short message (at least 10 characters).";

  if (input.privacyNoticeAccepted !== true) errors.privacyNoticeAccepted = "Please confirm you have read the privacy notice.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, email, phone, topic: topic as ContactTopic, message } };
}
