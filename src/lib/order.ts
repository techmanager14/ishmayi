// Checkout rules shared by the checkout form (browser) and /api/checkout (server).

import { normalisePhone } from "./enquiry";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export interface CheckoutInput {
  fullName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  /** "This order is a gift": deliver to the recipient, with an optional message. */
  isGift: boolean;
  giftRecipient: string;
  giftPhone: string;
  giftMessage: string;
  privacyNoticeAccepted: boolean;
  marketingConsent: boolean;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutInput, string>>;

export const emptyCheckout: CheckoutInput = {
  fullName: "",
  phone: "",
  email: "",
  address1: "",
  address2: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  notes: "",
  isGift: false,
  giftRecipient: "",
  giftPhone: "",
  giftMessage: "",
  privacyNoticeAccepted: false,
  marketingConsent: false,
};

export interface CheckoutCustomer {
  fullName: string;
  phone: string;
  email: string;
  address: { line1: string; line2: string | null; city: string; state: string; pincode: string; country: "IN" };
  notes: string | null;
  gift: { recipient: string; phone: string; message: string | null } | null;
  marketingConsent: boolean;
}

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

export function validateCheckout(input: Partial<Record<keyof CheckoutInput, unknown>>):
  | { ok: true; data: CheckoutCustomer }
  | { ok: false; errors: CheckoutErrors } {
  const e: CheckoutErrors = {};

  const fullName = text(input.fullName, 100);
  if (fullName.length < 2) e.fullName = "Please enter your full name.";

  const phone = normalisePhone(text(input.phone, 25));
  if (!phone) e.phone = "Please enter a valid mobile number.";

  const email = text(input.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Please enter a valid email address.";

  const isGift = input.isGift === true;
  const giftRecipient = text(input.giftRecipient, 100);
  const giftPhone = normalisePhone(text(input.giftPhone, 25));
  if (isGift && giftRecipient.length < 2) e.giftRecipient = "Please enter the recipient's name.";
  if (isGift && !giftPhone) e.giftPhone = "Please enter the recipient's mobile number, so the courier can reach them.";
  const giftMessage = text(input.giftMessage, 300);

  const line1 = text(input.address1, 150);
  if (line1.length < 5) e.address1 = "Please enter your house / flat and street.";
  const line2 = text(input.address2, 150);
  const city = text(input.city, 60);
  if (city.length < 2) e.city = "Please enter your city.";
  const state = text(input.state, 60);
  if (!INDIAN_STATES.includes(state as (typeof INDIAN_STATES)[number])) e.state = "Please choose your state.";
  const pincode = text(input.pincode, 6);
  if (!/^[1-9]\d{5}$/.test(pincode)) e.pincode = "Please enter a valid 6-digit PIN code.";

  const notes = text(input.notes, 300);

  if (input.privacyNoticeAccepted !== true) e.privacyNoticeAccepted = "Please accept the terms and privacy notice.";

  if (Object.keys(e).length) return { ok: false, errors: e };
  return {
    ok: true,
    data: {
      fullName,
      phone: phone!,
      email,
      address: { line1, line2: line2 || null, city, state, pincode, country: "IN" },
      notes: notes || null,
      gift: isGift ? { recipient: giftRecipient, phone: giftPhone!, message: giftMessage || null } : null,
      marketingConsent: input.marketingConsent === true,
    },
  };
}

/** Cart line as sent to the server (prices are never trusted from the browser). */
export interface CheckoutLineInput {
  productId: string;
  variantId: string;
  qty: number;
}

export interface PricedLine {
  productId: string;
  variantId: string;
  title: string;
  variantTitle: string | null;
  image: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}
