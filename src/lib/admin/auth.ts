import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";
import { firebaseApp, isFirebaseConfigured } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "__session"; // the only cookie name Firebase Hosting/CDNs pass through
export const SESSION_DAYS = 5;

export interface AdminUser {
  email: string;
  devBypass?: boolean;
}

/**
 * Local development without Firebase has no way to sign in, so the dashboard opens with a
 * visible "dev mode" banner. Never in production: NODE_ENV is "production" for `next start`
 * and on Vercel, even if ZS_ALLOW_MEMORY_STORE is set.
 */
export function isDevBypass(): boolean {
  return process.env.NODE_ENV === "development" && !isFirebaseConfigured();
}

function allowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Staff = custom claim `admin: true`, or an email listed in ADMIN_EMAILS. */
export function isAdminToken(token: { email?: string; admin?: unknown; email_verified?: boolean }): boolean {
  if (token.admin === true) return true;
  return Boolean(token.email && allowlist().includes(token.email.toLowerCase()));
}

/** Current admin, or null. Verifies the session cookie (and that it hasn't been revoked). */
export async function getAdmin(): Promise<AdminUser | null> {
  if (isDevBypass()) return { email: "dev@localhost", devBypass: true };
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await getAuth(firebaseApp()).verifySessionCookie(cookie, true);
    return isAdminToken(decoded) ? { email: decoded.email ?? "unknown" } : null;
  } catch {
    return null;
  }
}

/**
 * Call at the top of EVERY admin page and server action. Layouts are not enough:
 * Next.js can skip re-rendering a shared layout on client navigation.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
