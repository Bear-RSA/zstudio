import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, NoticeBox } from "@/components/LegalPage";
import { contact } from "@/content/contact";
import { legal } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description:
    "The terms for photography, videography, studio bookings, gear rental and workshops at Z Studios.",
};

const sections = [
  { id: "about", title: "About us and definitions" },
  { id: "acceptance", title: "Acceptance of these terms" },
  { id: "bookings", title: "Bookings and payment" },
  { id: "cancellations", title: "Cancellation and rescheduling" },
  { id: "session", title: "Your session" },
  { id: "studio", title: "Studio care" },
  { id: "delivery", title: "Turnaround and delivery" },
  { id: "copyright", title: "Usage rights and copyright" },
  { id: "gear", title: "Gear rental" },
  { id: "workshops", title: "Workshops" },
  { id: "liability", title: "Loss of footage and liability" },
  { id: "events", title: "Force majeure" },
  { id: "refusal", title: "Right to refuse service" },
  { id: "website", title: "Website content" },
  { id: "law", title: "Complaints, law and changes" },
];

export default function TermsPage() {
  const n = (id: string) => sections.findIndex((s) => s.id === id) + 1;
  const mail = <a href={`mailto:${contact.email}`}>{contact.email}</a>;

  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms and conditions"
      effectiveDate={legal.termsEffectiveDate}
      sections={sections}
      intro={
        <>
          <p>
            We are dedicated to providing exceptional photography, videography and gear rental services tailored to
            your needs. To ensure clarity and mutual understanding, please read these terms. They apply to all
            engagements unless we agree otherwise in writing. Please pay particular attention to the highlighted
            clauses, which limit our liability or place risk on you.
          </p>
          <p className="mt-3">
            Nothing in these terms takes away your rights under the Consumer Protection Act 68 of 2008 or the
            Electronic Communications and Transactions Act 25 of 2002.
          </p>
        </>
      }
    >
      <LegalSection id="about" n={n("about")} title="About us and definitions">
        <ul>
          <li>
            <strong>&ldquo;The Service Provider&rdquo;</strong>, &ldquo;we&rdquo; or &ldquo;us&rdquo;:{" "}
            {legal.entityName}
            {legal.registrationNumber && <>, registration number {legal.registrationNumber}</>}
            {legal.vatNumber && <>, VAT number {legal.vatNumber}</>}.
          </li>
          <li>
            <strong>&ldquo;The Client&rdquo;</strong> or &ldquo;you&rdquo;: any individual, firm or company engaging
            our services.
          </li>
          <li>
            <strong>&ldquo;Services&rdquo;</strong>: the photography, videography, studio, gear rental and workshop
            services we provide.
          </li>
        </ul>
        <ul>
          <li>
            <strong>Physical address:</strong> {contact.address.join(", ")}
          </li>
          <li>
            <strong>Email:</strong> {mail}
          </li>
          <li>
            <strong>Phone and WhatsApp:</strong> {contact.phone}
          </li>
          <li>
            <strong>Hours:</strong> {contact.hours}
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptance" n={n("acceptance")} title="Acceptance of these terms">
        <p>
          By accepting our cost estimate, engaging our services, proceeding with a booking or making a payment, you
          confirm that you have read, understood and agreed to these terms in full. All contracts and transactions
          between us, whether oral or written, are governed by them.
        </p>
      </LegalSection>

      <LegalSection id="bookings" n={n("bookings")} title="Bookings and payment">
        <ol>
          <li>
            Sending a booking through this website is an enquiry. We email you a reference number and our banking
            details, and hold your dates for 48 hours.
          </li>
          <li>
            <strong>Deposit:</strong> a non-refundable deposit of 50% is required to secure your booking. It confirms
            your date and gives you priority. If we don&rsquo;t receive it within 48 hours, the hold lapses and the
            dates are released.
          </li>
          <li>
            <strong>Final payment:</strong> the remaining balance is due on the day of the shoot. Payment must be made
            in full before any images or footage are released.
          </li>
          <li>
            Payments are made by EFT, using your reference, or by another method agreed before the shoot.
          </li>
        </ol>
      </LegalSection>

      <LegalSection id="cancellations" n={n("cancellations")} title="Cancellation and rescheduling">
        <NoticeBox>
          <p>
            <strong>Important: deposits are non-refundable.</strong> Cancellations made less than 72 hours before the
            scheduled shoot may be charged the full booking fee.
          </p>
        </NoticeBox>
        <ul>
          <li>
            You may ask to reschedule if you give at least 72 hours&rsquo; notice before the scheduled shoot.
            Rescheduling depends on availability and is not guaranteed.
          </li>
          <li>To cancel or reschedule, email {mail} or send us a WhatsApp message.</li>
        </ul>
      </LegalSection>

      <LegalSection id="session" n={n("session")} title="Your session">
        <ul>
          <li>
            <strong>Be photo-ready.</strong> Please arrive ready to shoot. Personal hairdressers, makeup artists and
            nail technicians are not allowed on the premises unless arranged or contracted by Z Studios. You&rsquo;re
            welcome to book our own makeup and hair services, where available.
          </li>
          <li>
            <strong>Late arrival.</strong> Sessions start at the booked time, not when you arrive. Arriving late means
            less shooting time.
          </li>
          <li>
            <strong>Overtime.</strong> Time beyond your booked session is overtime, charged at an agreed hourly rate
            and subject to availability.
          </li>
          <li>
            <strong>Cooperation.</strong> You agree to cooperate fully during the shoot. Lateness, lack of
            preparation, not following direction, or interruptions by you or others may affect the quality and
            outcome of the Services.
          </li>
          <li>
            <strong>Guests.</strong> Only people directly involved in the shoot may be in the studio, unless we have
            approved others beforehand.
          </li>
          <li>
            <strong>Children.</strong> Parents and guardians are solely responsible for supervising children and minors
            at all times while on our premises.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="studio" n={n("studio")} title="Studio care">
        <ul>
          <li>
            Please leave the studio clean and as you found it. We may charge extra cleaning fees for excessive mess,
            damage, or the disposal of props, food, drinks, confetti, glitter, smoke effects or other materials brought
            in without our approval.
          </li>
          <li>
            Handle all studio props, furniture, backdrops and equipment with care. You are responsible for any damage
            caused during your booking.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="delivery" n={n("delivery")} title="Turnaround and delivery">
        <ul>
          <li>
            <strong>Photographs:</strong> final edited photos are delivered within 72 hours of the shoot.
          </li>
          <li>
            <strong>Video:</strong> final edited video is delivered within 3 to 5 working days of the shoot, unless
            agreed otherwise.
          </li>
          <li>Timelines may vary slightly with workload. We will tell you in advance about any delay.</li>
          <li>
            <strong>RAW and unedited content</strong> (RAW files, unedited photos and unedited footage) remains our
            property and is not part of standard delivery unless agreed in writing. We may decline to release it.
          </li>
          <li>
            <strong>Proofs and previews</strong> (preview images, contact sheets, watermarked content and draft edits)
            remain our property and may not be screenshotted, recorded, edited, shared or published without our
            written permission.
          </li>
        </ul>
        <NoticeBox>
          <p>
            <strong>Important: download your files.</strong> We store final edited photos, video and digital content
            for up to two months from final delivery. Please download and back up your files when you receive them.
            After two months we may permanently delete them without further notice, and we are not liable for files
            lost after that period.
          </p>
        </NoticeBox>
      </LegalSection>

      <LegalSection id="copyright" n={n("copyright")} title="Usage rights and copyright">
        <ul>
          <li>All images and video we create remain our intellectual property.</li>
          <li>
            Once you have paid in full, you receive a non-exclusive licence to use the delivered content for personal
            use or for commercial purposes we have agreed. You may not resell, redistribute or alter the content for
            commercial gain without our written consent.
          </li>
          <li>
            We may use all images and video for marketing, promotion, our portfolio and social media, unless we agree
            otherwise in writing.
          </li>
          <li>
            <strong>Retention of title:</strong> we keep ownership of all materials, images, footage and rented
            equipment until we have received full payment. Your licence to use images or footage depends on all
            invoices being paid in full.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="gear" n={n("gear")} title="Gear rental">
        <ul>
          <li>
            Rental is charged per business day (Monday to Friday, excluding South African public holidays), from the
            day you collect the equipment up to and including the last day of your booking. Weekends and public
            holidays that fall within your rental period are not charged.
          </li>
          <li>
            Gear must be booked at least seven days in advance and is subject to availability. We can&rsquo;t
            accommodate late or last-minute bookings. A rental is confirmed only once the agreed deposit or full
            payment has been received.
          </li>
          <li>
            Equipment is collected and returned on business days only. It must be returned undamaged on the next
            business day after the last day of your booking (for example, gear booked for a Friday is returned on
            the Monday, or the Tuesday if that Monday is a public holiday). Collection and return are your
            responsibility, at your own cost.
          </li>
          <li>
            You confirm that you have inspected the equipment and accepted it in good working condition when you
            collect it or it is delivered.
          </li>
          <li>
            Use the equipment appropriately. You may not lend, sub-rent or transfer it, or let anyone else use it,
            without our written consent.
          </li>
          <li>
            Equipment returned after the agreed rental period is charged at the standard daily rental rate for the
            extra time.
          </li>
        </ul>
        <NoticeBox>
          <p>
            <strong>Important: you carry the risk.</strong> Risk passes to you on collection or delivery, and you must
            return the equipment in exactly the same condition. You are responsible for any loss, damage or misuse
            during the rental period. If equipment is damaged while in your possession, you pay 10% of its cost price.
            If it is damaged beyond repair or lost, you must replace it.
          </p>
        </NoticeBox>
      </LegalSection>

      <LegalSection id="workshops" n={n("workshops")} title="Workshops">
        <ul>
          <li>Seats are held for 48 hours and confirmed once your payment reflects.</li>
          <li>
            You may cancel for a full refund up to 7 days before the workshop. After that we can&rsquo;t refund your
            seat, but you can transfer it to someone else by telling us their name.
          </li>
          <li>If we cancel or reschedule a workshop, you choose between a full refund and a seat at the new date.</li>
          <li>Anyone under 18 must be signed up by a parent or guardian.</li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" n={n("liability")} title="Loss of footage and liability">
        <p>
          We take every reasonable precaution to safeguard the photos, footage and files from your shoot, but
          equipment failure, file corruption, theft, accidental deletion or other technical problems can happen.
        </p>
        <NoticeBox>
          <p>
            <strong>Important: limits on our liability.</strong> If photos, footage or files are lost, damaged,
            corrupted or unusable before final delivery:
          </p>
          <ol className="mt-2 list-decimal pl-5">
            <li className="mt-1.5">we will first offer you a reshoot at no extra cost, subject to availability;</li>
            <li className="mt-1.5">
              if you decline the reshoot, we refund what you paid, less 20% to cover time, labour, studio use and
              costs already incurred.
            </li>
          </ol>
          <p className="mt-2">
            Our liability is limited to these remedies, except where the Consumer Protection Act does not allow it to
            be limited.
          </p>
        </NoticeBox>
      </LegalSection>

      <LegalSection id="events" n={n("events")} title="Force majeure">
        <p>
          We are not liable for any delay, interruption or failure to provide the Services caused by circumstances
          beyond our reasonable control, including load-shedding, severe weather, equipment theft, natural disasters,
          government restrictions and emergencies.
        </p>
      </LegalSection>

      <LegalSection id="refusal" n={n("refusal")} title="Right to refuse service">
        <p>
          We may refuse or end the Services without a refund if you or anyone with you behaves in an inappropriate,
          unsafe, abusive, discriminatory or unlawful way.
        </p>
      </LegalSection>

      <LegalSection id="website" n={n("website")} title="Website content">
        <p>
          The content, images and videos on this website, and those we provide to clients, are copyright of Z
          Studios. They may not be reproduced without our express written permission.
        </p>
      </LegalSection>

      <LegalSection id="law" n={n("law")} title="Complaints, law and changes">
        <p>
          If something goes wrong, tell us at {mail} and we will try to put it right. If we can&rsquo;t resolve it,
          you may refer it to the Consumer Goods and Services Ombud or the National Consumer Commission.
        </p>
        <p>
          These terms are governed by South African law. We may update them; the version on this page when you book
          applies to that booking. How we handle your personal information is set out in our{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
