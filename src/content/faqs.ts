import { site, storeDefaults } from "@/lib/site";

export interface Faq {
  q: string;
  a: string;
}

export const faqGroups: { title: string; id: string; items: Faq[] }[] = [
  {
    title: "Shopping",
    id: "shopping",
    items: [
      {
        q: "Do I need an account to order?",
        a: "Yes. A free account lets you check out, track your order and see your invoices. Your bag and wishlist are saved on your device while you browse.",
      },
      {
        q: "How do promo codes work?",
        a: "Enter your code at checkout and the discount is applied to your order. Each code has its own conditions, shown on the Offers page. One offer applies per order.",
      },
      {
        q: "Do you take bulk orders?",
        a: "Yes. Send us a bulk order enquiry from the Offers page with the pieces and quantities you have in mind, and we will reply with the details.",
      },
    ],
  },
  {
    title: "Payment & delivery",
    id: "delivery",
    items: [
      {
        q: "How do I pay?",
        a: site.codEnabled
          ? "You can pay online at checkout (UPI, card, netbanking or wallet through Razorpay) or choose Cash on Delivery and pay when your order arrives. Card details go directly to Razorpay and are never stored by us."
          : "Full payment is taken when the order is placed. You pay securely at checkout by UPI, card, netbanking or wallet through Razorpay. Card details go directly to Razorpay and are never stored by us.",
      },
      {
        q: "Is GST included in the prices?",
        a: "Listed prices exclude GST. GST is added at checkout and shown clearly before you pay.",
      },
      {
        q: "How long does delivery take?",
        a: `Estimated delivery is ${storeDefaults.deliveryDays} days from order confirmation. You will receive tracking details once your parcel is dispatched.`,
      },
    ],
  },
  {
    title: "Returns & damage",
    id: "returns",
    items: [
      {
        q: "What if my parcel arrives damaged?",
        a: "Record one continuous video while opening the sealed parcel, then upload it on our Report a damaged parcel page within 24 hours of delivery. Once we have reviewed it, we refund the damaged piece to your original payment method.",
      },
      {
        q: "Can I cancel an order?",
        a: "Please contact us as soon as possible. Our Cancellation & Refund Policy explains what can be cancelled and how refunds are paid.",
      },
    ],
  },
];

export const allFaqs = faqGroups.flatMap((g) => g.items);
