import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { Booking } from "@/lib/booking/types";
import type { BankDetails } from "@/lib/config";
import { formatDisplayDate } from "@/lib/booking/dates";
import { formatRand } from "@/lib/money";

const c = {
  bg: "#0B0A09",
  surface: "#141210",
  line: "#2A2420",
  text: "#EDE6DF",
  muted: "#9A8F86",
  accent: "#C9967A",
};

const label = { color: c.muted, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, margin: "0 0 4px" };
const value = { color: c.text, fontSize: 15, margin: "0 0 16px" };

interface Props {
  booking: Booking;
  audience: "internal" | "customer";
  bank: BankDetails;
  proofOfPaymentEmail: string;
  holdHours: number;
}

export function EnquiryEmail({ booking, audience, bank, proofOfPaymentEmail, holdHours }: Props) {
  const internal = audience === "internal";
  const { customer } = booking;

  return (
    <Html>
      <Head />
      <Preview>
        {internal
          ? `New enquiry ${booking.reference} — ${customer.fullName}, ${formatRand(booking.total)}`
          : `Your Z Studios enquiry ${booking.reference}`}
      </Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, border: `1px solid ${c.line}`, maxWidth: 560, padding: 32 }}>
          <Text style={{ color: c.accent, fontFamily: "Georgia, serif", fontSize: 20, letterSpacing: "0.35em", margin: 0 }}>
            Z STUDIOS
          </Text>
          <Heading style={{ color: c.text, fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 26, margin: "24px 0 8px" }}>
            {internal ? (booking.items.every((i) => i.kind === "workshop") ? "New workshop sign-up" : "New hire enquiry") : `Thank you, ${customer.fullName.split(" ")[0]}.`}
          </Heading>
          <Text style={{ color: c.muted, fontSize: 14, lineHeight: "22px", margin: "0 0 24px" }}>
            {internal
              ? `Held for ${holdHours} hours pending EFT. Match the payment to the reference below.`
              : `We're holding your booking for ${holdHours} hours. Pay by EFT using the reference below and send your proof of payment to ${proofOfPaymentEmail}.`}
          </Text>

          <Section style={{ border: `1px solid ${c.accent}`, padding: "16px 20px", marginBottom: 24 }}>
            <Text style={label}>Reference</Text>
            <Text style={{ color: c.accent, fontSize: 24, letterSpacing: "0.08em", margin: 0, fontFamily: "monospace" }}>
              {booking.reference}
            </Text>
          </Section>

          <Text style={label}>Dates</Text>
          <Text style={value}>
            {formatDisplayDate(booking.startDate)} → {formatDisplayDate(booking.endDate)} ({booking.days}{" "}
            {booking.days === 1 ? "day" : "days"})
          </Text>
          {booking.details ? <Text style={{ ...value, marginTop: -10, color: c.muted }}>{booking.details}</Text> : null}

          <Text style={label}>Items</Text>
          {booking.items.map((item) => (
            <Text key={item.resourceId} style={{ ...value, margin: "0 0 6px" }}>
              {item.qty} × {item.name}
              <span style={{ color: c.muted }}>
                {" "}
                · {formatRand(item.dailyRate)}/day · {formatRand(item.lineTotal)}
              </span>
            </Text>
          ))}
          <Hr style={{ borderColor: c.line, margin: "16px 0" }} />
          <Text style={{ ...value, fontSize: 18 }}>
            Total <span style={{ color: c.accent, float: "right" }}>{formatRand(booking.total)}</span>
          </Text>

          {internal ? (
            <>
              <Hr style={{ borderColor: c.line, margin: "16px 0" }} />
              <Text style={label}>Hirer</Text>
              <Text style={{ ...value, lineHeight: "22px" }}>
                {customer.fullName}
                {customer.company ? ` (${customer.company})` : ""}
                <br />
                {customer.email}
                <br />
                {customer.phone}
                <br />
                {customer.idNumber ? <>ID/Passport: {customer.idNumber}</> : null}
              </Text>
              {customer.notes ? (
                <>
                  <Text style={label}>Notes</Text>
                  <Text style={value}>{customer.notes}</Text>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Hr style={{ borderColor: c.line, margin: "16px 0" }} />
              <Text style={label}>Banking details</Text>
              <Text style={{ ...value, lineHeight: "24px" }}>
                {bank.bankName}
                <br />
                Account name: {bank.accountName}
                <br />
                Account number: {bank.accountNumber}
                <br />
                Branch code: {bank.branchCode}
                <br />
                Account type: {bank.accountType}
                <br />
                Reference: <span style={{ color: c.accent }}>{booking.reference}</span>
              </Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}
