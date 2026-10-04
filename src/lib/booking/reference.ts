import { randomInt } from "node:crypto";
import { todaySA } from "./dates";

// Crockford base32 without the ambiguous 0/O/1/I/L — easy to read off a bank statement.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export const REFERENCE_PATTERN = /^ZS-\d{6}-[2-9A-HJKMNP-TV-Z]{4}$/;

/** ZS-YYMMDD-XXXX, e.g. ZS-261004-K7QM. Uniqueness is enforced by tx.create(). */
export function generateReference(now: Date = new Date()): string {
  const date = todaySA(now).replaceAll("-", "").slice(2);
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `ZS-${date}-${suffix}`;
}
