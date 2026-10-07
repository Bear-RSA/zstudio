import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { Booking } from "@/lib/booking/types";
import { formatDisplayDate } from "@/lib/booking/dates";
import { formatRand } from "@/lib/money";

const c = { bg: "#FDF9F9", surface: "#FAF0F3", line: "#F0DFE5", text: "#2B1B22", muted: "#74606A", accent: "#A8385F" };
const label = { color: c.muted, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, margin: "0 0 4px" };
const value = { color: c.text, fontSize: 15, margin: "0 0 16px" };

/** Sent to the customer when Zstudio marks their EFT payment as received. */
export function BookingConfirmedEmail({ booking, contactEmail }: { booking: Booking; contactEmail: string }) {
  const workshop = booking.items.every((i) => i.kind === "workshop");
  const first = booking.customer.fullName.split(" ")[0];
  const dates =
    booking.startDate === booking.endDate
      ? formatDisplayDate(booking.startDate)
      : `${formatDisplayDate(booking.startDate)} → ${formatDisplayDate(booking.endDate)}`;

  return (
    <Html>
      <Head />
      <Preview>{`Payment received — ${booking.reference} is confirmed`}</Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, border: `1px solid ${c.line}`, maxWidth: 560, padding: 32 }}>
          <Text style={{ color: c.accent, fontFamily: "Georgia, serif", fontSize: 20, letterSpacing: "0.35em", margin: 0 }}>
            Z STUDIOS
          </Text>
          <Heading style={{ color: c.text, fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 26, margin: "24px 0 8px" }}>
            You&rsquo;re booked, {first}.
          </Heading>
          <Text style={{ color: c.muted, fontSize: 14, lineHeight: "22px", margin: "0 0 24px" }}>
            {booking.slots?.length ? "We’ve received your deposit." : `We’ve received your payment of ${formatRand(booking.total)}.`}{" "}
            {workshop ? "Your seat is confirmed — see you there." : "Your booking is confirmed and the dates are yours."}
          </Text>

          <Section style={{ border: `1px solid ${c.accent}`, padding: "16px 20px", marginBottom: 24 }}>
            <Text style={label}>Reference</Text>
            <Text style={{ color: c.accent, fontSize: 22, letterSpacing: "0.08em", margin: 0, fontFamily: "monospace" }}>
              {booking.reference}
            </Text>
          </Section>

          <Text style={label}>{workshop ? "Date" : "Dates"}</Text>
          <Text style={value}>{dates}</Text>
          {booking.details ? <Text style={{ ...value, marginTop: -10, color: c.muted }}>{booking.details}</Text> : null}

          <Text style={label}>{workshop ? "Workshop" : "Booked"}</Text>
          {booking.items.map((i) => (
            <Text key={i.resourceId} style={{ ...value, margin: "0 0 6px" }}>
              {booking.slots?.length ? i.name : `${i.qty} × ${i.name}`}
            </Text>
          ))}
          <Hr style={{ borderColor: c.line, margin: "16px 0" }} />
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: "20px", margin: 0 }}>
            Questions or changes? Reply to this email or write to {contactEmail}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
