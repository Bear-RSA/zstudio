import "server-only";

function env(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

/** Business details. Placeholders are deliberately obvious — replace in .env.local. */
export const business = {
  name: "Z Studios",
  city: "Cape Town",
  bookingsInbox: env("BOOKINGS_INBOX", "bookings@example.com"),
  emailFrom: env("EMAIL_FROM", "Z Studios <onboarding@resend.dev>"),
  proofOfPaymentEmail: env("PROOF_OF_PAYMENT_EMAIL", "accounts@example.com"),
  bank: {
    bankName: env("BANK_NAME", "[BANK NAME]"),
    accountName: env("BANK_ACCOUNT_NAME", "[ACCOUNT NAME]"),
    accountNumber: env("BANK_ACCOUNT_NUMBER", "[ACCOUNT NUMBER]"),
    branchCode: env("BANK_BRANCH_CODE", "[BRANCH CODE]"),
    accountType: env("BANK_ACCOUNT_TYPE", "Business Cheque"),
  },
  holdHours: Number(env("HOLD_HOURS", "48")),
};

export type BankDetails = typeof business.bank;
