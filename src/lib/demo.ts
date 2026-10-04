import "server-only";
import { isFirebaseConfigured } from "@/lib/firebase/admin";

/**
 * Client-preview deployments: DEMO_MODE=1 runs the site on in-memory sample data with a visible
 * banner, an open admin dashboard and no outgoing email. It switches itself off as soon as
 * Firebase is configured, so it can't survive into the real launch.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1" && !isFirebaseConfigured();
}
