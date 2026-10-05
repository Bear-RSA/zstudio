import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, NoticeBox } from "@/components/LegalPage";
import { contact } from "@/content/contact";
import { cancellationTiers, legal } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms for booking studio time, hiring equipment and attending workshops at Z Studios.",
};

const sections = [
  { id: "about", title: "About us" },
  { id: "bookings", title: "Bookings and payment" },
  { id: "prices", title: "Prices" },
  { id: "cancellations", title: "Cancellations and changes" },
  { id: "studio", title: "Studio hire" },
  { id: "equipment", title: "Equipment hire" },
  { id: "workshops", title: "Workshops" },
  { id: "content", title: "Your content" },
  { id: "liability", title: "Risk and liability" },
  { id: "events", title: "Events outside our control" },
  { id: "complaints", title: "Complaints" },
  { id: "law", title: "Law and changes" },
];

export default function TermsPage() {
  const n = (id: string) => sections.findIndex((s) => s.id === id) + 1;
  const mail = <a href={`mailto:${contact.email}`}>{contact.email}</a>;

  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms and conditions"
      sections={sections}
      intro={
        <>
          <p>
            These terms apply when you book studio time, hire equipment or sign up for a workshop with{" "}
            {legal.entityName}. By ticking the box when you book, you agree to them. Please read them, especially the
            highlighted clauses, which limit our liability or place risk on you.
          </p>
          <p className="mt-3">
            Nothing in these terms takes away your rights under the Consumer Protection Act 68 of 2008 or the
            Electronic Communications and Transactions Act 25 of 2002.
          </p>
        </>
      }
    >
      <LegalSection id="about" n={n("about")} title="About us">
        <ul>
          <li>
            <strong>Name:</strong> {legal.entityName}
            {legal.registrationNumber && <>, registration number {legal.registrationNumber}</>}
            {legal.vatNumber && <>, VAT number {legal.vatNumber}</>}
          </li>
          <li>
            <strong>Address:</strong> {contact.address.join(", ")}
          </li>
          <li>
            <strong>Phone and WhatsApp:</strong> {contact.phone}
          </li>
          <li>
            <strong>Email:</strong> {mail}
          </li>
          <li>
            <strong>Hours:</strong> {contact.hours}
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="bookings" n={n("bookings")} title="Bookings and payment">
        <ol>
          <li>
            Sending a booking through this website is an enquiry. We email you a reference number and our banking
            details.
          </li>
          <li>
            We hold your dates, items or seats for 48 hours. Pay the full amount by EFT within that time, using your
            reference, and send us proof of payment.
          </li>
          <li>
            Your booking is confirmed once the payment reflects in our account and we confirm it to you. That is when
            the agreement between us is concluded.
          </li>
          <li>If we don&rsquo;t receive payment within 48 hours, the hold lapses and the dates are released.</li>
          <li>
            Bookings must be made by someone 18 or older. The person named on the booking is responsible for it,
            including for anyone they bring.
          </li>
          <li>
            We may decline a booking, for example if the details are incomplete or we can&rsquo;t verify who you are.
            If we have taken payment, we refund it in full.
          </li>
        </ol>
      </LegalSection>

      <LegalSection id="prices" n={n("prices")} title="Prices">
        <p>
          Prices are in South African rand and are those shown on the website when you send your enquiry. Studio and
          equipment are charged per day: a day means our opening hours that day ({contact.hours}).
          If a price is shown incorrectly because of an obvious error, we will tell you before you pay, and you can
          choose to go ahead at the correct price or cancel.
        </p>
      </LegalSection>

      <LegalSection id="cancellations" n={n("cancellations")} title="Cancellations and changes">
        <p>
          You may cancel a confirmed studio or equipment booking by emailing {mail} or sending a WhatsApp message. The
          fee depends on how much notice you give before your first booked day:
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-bone">
              <th className="py-2 pr-4 font-normal">Notice</th>
              <th className="py-2 font-normal">Cancellation fee</th>
            </tr>
          </thead>
          <tbody>
            {cancellationTiers.map((t) => (
              <tr key={t.notice} className="border-b border-line">
                <td className="py-2 pr-4">{t.notice}</td>
                <td className="py-2">{t.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul>
          <li>
            We won&rsquo;t charge a cancellation fee if you can&rsquo;t keep the booking because of your death or
            hospitalisation, or that of the person named on the booking (CPA section 17).
          </li>
          <li>
            Where the seven-day cooling-off right in section 44 of the ECTA applies, you may cancel within seven days
            of payment without a fee.
          </li>
          <li>
            You may move a booking to other available dates once, free of charge, if you ask at least 48 hours before
            your first booked day.
          </li>
          <li>
            If we have to cancel, we refund you in full or move the booking to dates that suit you. That is the
            limit of what we owe you for our cancellation.
          </li>
          <li>Refunds are paid by EFT to the account you paid from, within 10 working days.</li>
        </ul>
      </LegalSection>

      <LegalSection id="studio" n={n("studio")} title="Studio hire">
        <ul>
          <li>Your booking includes time to set up and pack down. Please leave the space as you found it.</li>
          <li>
            If you stay past closing time without our agreement, we may charge for the extra time at the daily rate.
          </li>
          <li>
            Ask us first before using smoke or haze machines, open flames, glitter, confetti, paint, food, liquids or
            animals in the studio. You pay any cleaning, repainting or repair costs they cause.
          </li>
          <li>
            Follow reasonable instructions from our staff, including about safety, the number of people present and
            the use of our power.
          </li>
          <li>
            We may end a session without a refund if anyone on the booking puts people or property at risk, or acts
            unlawfully.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="equipment" n={n("equipment")} title="Equipment hire">
        <ul>
          <li>
            When you collect, bring the ID or passport you booked with. We check the equipment with you, and you sign
            to confirm its condition.
          </li>
          <li>
            Return the equipment by closing time on your last booked day, clean and in the same condition. Each day
            late is charged at the daily rate.
          </li>
          <li>
            Use the equipment carefully, for its intended purpose, by people who know how to use it. Don&rsquo;t lend,
            sub-hire or modify it.
          </li>
          <li>
            Tell us straight away if anything is lost, stolen or damaged. Report a theft to the police and give us the
            case number.
          </li>
          <li>We may ask for a refundable security deposit for some items. We will tell you before you pay.</li>
        </ul>
        <NoticeBox>
          <p>
            <strong>Important: you carry the risk.</strong> From collection until we check the equipment back in, you
            are responsible for it. If it is lost, stolen or damaged (other than fair wear and tear, or a fault that
            existed before you collected it), you must pay the reasonable cost of repair, or the replacement cost of
            an equivalent item if it can&rsquo;t be repaired, plus the daily rate while it is out of use. We may deduct
            these amounts from any deposit.
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
          <li>
            If we cancel or reschedule a workshop, you choose between a full refund and a seat at the new date.
          </li>
          <li>Anyone under 18 must be signed up by a parent or guardian.</li>
        </ul>
      </LegalSection>

      <LegalSection id="content" n={n("content")} title="Your content">
        <p>
          You own everything you create in our studio or with our equipment. You confirm that you have the rights and
          permissions you need for what you produce, including music, locations, models and anyone you film or
          photograph.
        </p>
        <p>
          We won&rsquo;t publish your work or photos of your session without your permission. Course material from
          workshops is for your personal use.
        </p>
      </LegalSection>

      <LegalSection id="liability" n={n("liability")} title="Risk and liability">
        <NoticeBox>
          <p>
            <strong>Important: limits on our liability.</strong> As far as the law allows:
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li className="mt-1.5">
              personal belongings, equipment you bring and data you record are your responsibility. Please back up your
              files before you leave;
            </li>
            <li className="mt-1.5">
              we are not liable for indirect or consequential loss, such as lost income, lost footage or missed
              deadlines;
            </li>
            <li className="mt-1.5">
              our total liability for any booking is limited to the amount you paid for it.
            </li>
          </ul>
          <p className="mt-2">
            These limits don&rsquo;t apply to loss or harm caused by our gross negligence, or to anything the Consumer
            Protection Act does not allow us to exclude.
          </p>
        </NoticeBox>
        <p>
          You are responsible for loss or damage to our property, and injury to others, caused by you or anyone on
          your booking, other than through our own negligence.
        </p>
      </LegalSection>

      <LegalSection id="events" n={n("events")} title="Events outside our control">
        <p>
          We are not responsible for failing to provide a booking because of events we can&rsquo;t reasonably
          control, such as load-shedding or other power or water outages, severe weather, unrest or government
          orders. If that happens, we move your booking to other available dates or refund the part we couldn&rsquo;t
          provide.
        </p>
      </LegalSection>

      <LegalSection id="complaints" n={n("complaints")} title="Complaints">
        <p>
          If something goes wrong, tell us at {mail} and we will try to put it right. If we can&rsquo;t resolve it,
          you may refer it to the Consumer Goods and Services Ombud or the National Consumer Commission.
        </p>
      </LegalSection>

      <LegalSection id="law" n={n("law")} title="Law and changes">
        <p>
          These terms are governed by South African law. We may update them; the version on this page when you book
          applies to that booking. How we handle your personal information is set out in our{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
