import "server-only";
import { CLAIM_PREFIX, CLAIM_TAG, CLAIM_UPDATE_PREFIX } from "../claims";
import { REFUND_PREFIX, parseOrderTotal, parsePaymentId, parseRefundAmount } from "../refund-notes";
import { contactNotes, contactsWithTag, type Contact, type Note } from "./data";

export type ClaimStatus = "New" | "Refund approved" | "Rejected" | "Partially refunded" | "Refunded";
/** Decisions the team records by hand; the two "refunded" statuses come from the refunds themselves. */
export const CLAIM_STATUSES: ClaimStatus[] = ["Refund approved", "Rejected"];

export interface Claim {
  id: string;
  ref: string;
  contact: Contact;
  submitted: string;
  deliveredOn: string;
  issue: string;
  videoUrl: string;
  status: ClaimStatus;
  statusNote: string;
  /** What the customer paid, what has gone back, and what is left. */
  orderTotal: number;
  refunded: number;
  remaining: number;
  /** Razorpay payment to refund against, when the order was paid online. */
  paymentId: string | null;
}

const field = (body: string, name: string) => body.match(new RegExp(`^${name}: (.*)$`, "m"))?.[1]?.trim() ?? "";
const round2 = (n: number) => Math.round(n * 100) / 100;

/** The money on an order, read from the customer's notes. */
export function orderMoney(notes: Note[], ref: string) {
  const orderNote = notes.find((n) => n.body.includes(`Website order ${ref}`));
  const orderTotal = orderNote ? parseOrderTotal(orderNote.body) : 0;
  const refunded = round2(notes.filter((n) => n.body.startsWith(`${REFUND_PREFIX} ${ref}:`)).reduce((sum, n) => sum + parseRefundAmount(n.body), 0));
  return { orderTotal, refunded, remaining: round2(Math.max(0, orderTotal - refunded)), paymentId: orderNote ? parsePaymentId(orderNote.body) : null };
}

/** Every damage claim (newest first), read from the claim notes on tagged contacts. */
export async function listClaims(): Promise<Claim[]> {
  const contacts = await contactsWithTag(CLAIM_TAG);
  const perContact = await Promise.all(
    contacts.map(async (contact) => {
      const notes = await contactNotes(contact.id).catch(() => []);
      return notes
        .filter((n) => n.body.startsWith(CLAIM_PREFIX))
        .map((n): Claim => {
          const ref = n.body.slice(CLAIM_PREFIX.length).split("\n")[0].trim();
          // Latest status update for this order (notes are newest first).
          const update = notes.find((u) => u.body.startsWith(`${CLAIM_UPDATE_PREFIX} ${ref}:`));
          const decided = (update?.body.match(/: ([^\n]+)/)?.[1].split(" — ")[0].trim() as ClaimStatus | undefined) ?? "New";
          const money = orderMoney(notes, ref);
          const status: ClaimStatus =
            money.refunded > 0 ? (money.orderTotal > 0 && money.remaining <= 0 ? "Refunded" : "Partially refunded") : CLAIM_STATUSES.includes(decided) ? decided : "New";
          return {
            id: n.id,
            ref,
            contact,
            submitted: n.dateAdded,
            deliveredOn: field(n.body, "Delivered on"),
            issue: field(n.body, "Issue"),
            videoUrl: field(n.body, "Video"),
            status,
            statusNote: update?.body.split(" — ").slice(1).join(" — ").trim() ?? "",
            ...money,
          };
        });
    }),
  );
  return perContact.flat().sort((a, b) => b.submitted.localeCompare(a.submitted));
}
