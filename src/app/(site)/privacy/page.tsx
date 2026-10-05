import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { contact } from "@/content/contact";
import { legal } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Z Studios collects, uses and protects your personal information under POPIA.",
};

const sections = [
  { id: "who-we-are", title: "Who we are" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "why", title: "Why we use it" },
  { id: "id-numbers", title: "ID and passport numbers" },
  { id: "sharing", title: "Who we share it with" },
  { id: "cross-border", title: "Storage outside South Africa" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "How we protect it" },
  { id: "marketing", title: "Newsletter and marketing" },
  { id: "browser", title: "Cookies and your browser" },
  { id: "rights", title: "Your rights" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
];

export default function PrivacyPage() {
  const n = (id: string) => sections.findIndex((s) => s.id === id) + 1;
  const mail = <a href={`mailto:${contact.email}`}>{contact.email}</a>;

  return (
    <LegalPage
      eyebrow="POPIA"
      title="Privacy policy"
      sections={sections}
      intro={
        <p>
          This policy explains how {legal.entityName} handles your personal information when you use this website,
          book the studio or equipment, sign up for a workshop or join our newsletter. We process personal information
          in line with the Protection of Personal Information Act 4 of 2013 (POPIA).
        </p>
      }
    >
      <LegalSection id="who-we-are" n={n("who-we-are")} title="Who we are">
        <p>
          {legal.entityName}
          {legal.registrationNumber && <> (registration number {legal.registrationNumber})</>} is the responsible
          party for your personal information. We are at {contact.address.join(", ")}.
        </p>
        <p>
          Our Information Officer is {legal.informationOfficer}. For any privacy question or request, email {mail} or
          WhatsApp {contact.phone}.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" n={n("what-we-collect")} title="What we collect">
        <p>We only ask for what we need. Depending on what you do, that is:</p>
        <ul>
          <li>
            <strong>Studio and equipment bookings:</strong> your full name, email address, phone number, South African
            ID or passport number, company name (optional), any notes you add, the items and dates you book, and the
            booking total.
          </li>
          <li>
            <strong>Workshop sign-ups:</strong> your full name, email address, phone number, number of seats and any
            notes you add.
          </li>
          <li>
            <strong>Newsletter:</strong> your email address.
          </li>
          <li>
            <strong>Payments:</strong> the proof of payment you send us, which may show your name, bank and account
            details. We do not take card payments on this website.
          </li>
          <li>
            <strong>Messages:</strong> whatever you send us by email, WhatsApp, Instagram or phone.
          </li>
        </ul>
        <p>
          You give us this information directly. We do not buy personal information or collect it from third parties.
        </p>
      </LegalSection>

      <LegalSection id="why" n={n("why")} title="Why we use it">
        <p>We use your personal information to:</p>
        <ul>
          <li>respond to your enquiry, hold your dates and confirm your booking (to perform our agreement with you);</li>
          <li>match payments to bookings and keep accounting and tax records (to meet our legal obligations);</li>
          <li>
            identify the person responsible for hired equipment and recover it, or its value, if it is lost, stolen or
            damaged (our legitimate interest in protecting our property);
          </li>
          <li>send you workshop and studio news, if you subscribed (with your consent).</li>
        </ul>
        <p>We do not use your information for anything unrelated to these purposes, and we do not sell it.</p>
      </LegalSection>

      <LegalSection id="id-numbers" n={n("id-numbers")} title="ID and passport numbers">
        <p>
          We ask for an ID or passport number only when you hire studio time or equipment, because you are taking
          responsibility for valuable property. We use it to confirm who you are when you collect, and, if equipment
          is not returned or is damaged, to pursue a claim, report a loss to the police or our insurer, or take legal
          action.
        </p>
        <p>
          Only {legal.entityName} staff who manage bookings can see it. It is never shown on the website and never
          used for marketing. Workshop sign-ups do not ask for it.
        </p>
      </LegalSection>

      <LegalSection id="sharing" n={n("sharing")} title="Who we share it with">
        <p>
          We share personal information only with service providers who process it on our behalf and under our
          instructions (operators, in POPIA terms):
        </p>
        <ul>
          <li>
            <strong>Google Firebase</strong>, which stores our bookings database;
          </li>
          <li>
            <strong>Resend</strong>, which sends booking and confirmation emails;
          </li>
          <li>
            <strong>Vercel</strong>, which hosts this website.
          </li>
        </ul>
        <p>
          We may also disclose information where the law requires it, to the police or our insurer when hired
          equipment is lost or stolen, or to our legal advisers to protect our rights. Your bank and ours see payment
          details when you pay by EFT.
        </p>
      </LegalSection>

      <LegalSection id="cross-border" n={n("cross-border")} title="Storage outside South Africa">
        <p>
          Our service providers run servers outside South Africa, including in the United States and the European
          Union. We use them only because they are bound by data-protection laws or agreements that give your
          information protection substantially similar to POPIA, as section 72 of POPIA requires.
        </p>
      </LegalSection>

      <LegalSection id="retention" n={n("retention")} title="How long we keep it">
        <ul>
          <li>
            <strong>Bookings and payment records:</strong> five years after the booking, as South African tax law
            requires.
          </li>
          <li>
            <strong>ID and passport numbers:</strong> until the hire is complete and any claim for loss or damage is
            settled. We then remove them from the booking record.
          </li>
          <li>
            <strong>Unpaid enquiries:</strong> up to 12 months, so we can follow up on related questions.
          </li>
          <li>
            <strong>Newsletter:</strong> until you unsubscribe.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="security" n={n("security")} title="How we protect it">
        <p>
          We take reasonable technical and organisational measures to keep your information safe: the website is
          served over an encrypted connection, the bookings database is closed to the public, and only signed-in staff
          can see booking details. If we believe your personal information has been accessed without authorisation, we
          will tell you and the Information Regulator as POPIA requires.
        </p>
      </LegalSection>

      <LegalSection id="marketing" n={n("marketing")} title="Newsletter and marketing">
        <p>
          We send our newsletter only to people who sign up for it. Every email has a way to unsubscribe, or you can
          email {mail}. Booking someone&rsquo;s studio time does not sign them up for marketing.
        </p>
      </LegalSection>

      <LegalSection id="browser" n={n("browser")} title="Cookies and your browser">
        <p>
          We do not use advertising or analytics cookies. Your cart is saved in your own browser&rsquo;s storage so it
          survives a page refresh. It stays on your device and is cleared when your booking is sent. Staff sign-in uses
          one essential cookie.
        </p>
      </LegalSection>

      <LegalSection id="rights" n={n("rights")} title="Your rights">
        <p>Under POPIA you have the right to:</p>
        <ul>
          <li>ask whether we hold personal information about you, and for a copy of it;</li>
          <li>ask us to correct or delete information that is inaccurate, out of date, excessive or unlawfully held;</li>
          <li>object to us processing your information, on reasonable grounds;</li>
          <li>withdraw your consent to marketing at any time;</li>
          <li>
            complain to the{" "}
            <a href={legal.informationRegulatorUrl} target="_blank" rel="noreferrer">
              Information Regulator
            </a>
            .
          </li>
        </ul>
        <p>
          To make a request, email {mail}. We will need to confirm your identity first and will respond within a
          reasonable time, normally 30 days. Requests are free, except where the Promotion of Access to Information Act
          allows a prescribed fee for copies of records. We may refuse to delete records the law requires us to keep.
        </p>
        <p>We&rsquo;d appreciate the chance to sort out any concern before you go to the Regulator.</p>
      </LegalSection>

      <LegalSection id="children" n={n("children")} title="Children">
        <p>
          Bookings must be made by someone 18 or older. A parent or guardian must sign up anyone under 18 for a
          workshop, and in doing so consents to us processing the child&rsquo;s details for that workshop.
        </p>
      </LegalSection>

      <LegalSection id="changes" n={n("changes")} title="Changes to this policy">
        <p>
          We may update this policy. The effective date at the top shows when it last changed. See also our{" "}
          <Link href="/terms">terms and conditions</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
