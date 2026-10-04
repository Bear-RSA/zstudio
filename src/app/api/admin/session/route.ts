import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { firebaseApp } from "@/lib/firebase/admin";
import { isAdminToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/admin/auth";

// Reject cross-site requests: the cookie is SameSite=strict, but check Origin as well.
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  return !origin || new URL(origin).host === req.headers.get("host");
}

/** Exchange a fresh Firebase ID token for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const { idToken } = (await req.json().catch(() => ({}))) as { idToken?: string };
  if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const auth = getAuth(firebaseApp());
  try {
    const decoded = await auth.verifyIdToken(idToken, true);
    // Only mint a session from a sign-in that just happened, not a stale token.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    if (!isAdminToken(decoded)) {
      return NextResponse.json({ error: "This account doesn't have dashboard access." }, { status: 403 });
    }

    const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
    const session = await auth.createSessionCookie(idToken, { expiresIn });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 401 });
  }
}

/** Sign out: clear the cookie and revoke the user's refresh tokens. */
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const auth = getAuth(firebaseApp());
      const decoded = await auth.verifySessionCookie(cookie);
      await auth.revokeRefreshTokens(decoded.sub);
    } catch {
      /* already invalid — just clear it */
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
