import type { Metadata } from "next";
import { ContactList } from "@/components/ContactList";
import { PolicyPage } from "@/components/PolicyPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Ishmayi collects, uses and protects your personal information.",
  alternates: { canonical: "/policies/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage policy="privacy" title="Privacy Notice" intro="How we collect, use and protect your personal information.">
      <h2>Who we are</h2>
      <p>
        {site.name} is operated by {site.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), {site.address.street}, {site.address.locality}, {site.address.city} – {site.address.postalCode}. We are
        responsible for the personal information you submit through this website.
      </p>

      <h2>What we collect and why</h2>
      <h3>Accounts and orders</h3>
      <p>
        When you create an account or place an order we collect your name, email address, mobile number and delivery address, and any gift details you provide. We use them to process and deliver your order, send you
        updates and invoices, and let you see your order history. We do not sell your information.
      </p>

      <h3>Contact messages</h3>
      <p>When you use our contact form we collect your name, email address, optional mobile number, the topic and your message, and use them only to reply to you.</p>

      <h3>Wishlist and bag</h3>
      <p>Your wishlist and bag are stored in your own browser on this device. They are not sent to us until you check out.</p>

      <h3>Earlier consultation records</h3>
      <p>
        We no longer offer consultations. If you booked one in the past, we hold the details you gave us at the time, which may include your date of birth, birth time and birth place. These records are kept only as
        described under &ldquo;How long we keep it&rdquo; below, and you can ask us to access, correct or erase them at any time.
      </p>

      <h2>Who receives your information</h2>
      <ul>
        <li>
          <strong>Razorpay</strong>, our payment gateway, which processes your payment. Card and bank details go directly to Razorpay; we never see or store them.
        </li>
        <li>
          <strong>Our customer-management platform (GoHighLevel)</strong>, where your account, orders and messages are recorded so we can serve you and send you emails.
        </li>
        <li>Delivery partners, only as needed to deliver your order.</li>
      </ul>
      <p>These providers may process data outside India, subject to appropriate safeguards.</p>

      <h2 id="analytics">Analytics and cookies</h2>
      <p>
        With your permission, we use Google Analytics to understand how visitors use our website, for example which pages are viewed. Analytics events never include your phone number, email address or name. If you
        decline, analytics cookies are not set. You can change your choice at any time using &ldquo;Cookie settings&rdquo; in the website footer.
      </p>

      <h2>How we protect your information</h2>
      <p>The website is served over HTTPS, and access to your information is limited to the people who need it to serve you.</p>

      <h2>How long we keep it</h2>
      <p>We keep your records for as long as needed to provide our services and meet legal, tax and accounting obligations, and then delete or anonymise them.</p>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023, you may ask to access, correct, update or erase
        your personal data, withdraw consent, and nominate another person to exercise your rights. You may also raise a
        grievance with us, and if unresolved, with the Data Protection Board of India.
      </p>

      <h2>Contact us</h2>
      <p>For privacy questions or requests, contact:</p>
      <ContactList location="privacy" className="mt-4" />
    </PolicyPage>
  );
}
