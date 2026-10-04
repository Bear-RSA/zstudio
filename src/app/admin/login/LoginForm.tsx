"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { clientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

function message(e: unknown): string {
  const code = e instanceof FirebaseError ? e.code : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "That email and password don't match.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a few minutes, or reset your password.";
  if (code === "auth/network-request-failed") return "Network error — check your connection.";
  return e instanceof Error && !code ? e.message : "Sign-in failed. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isFirebaseClientConfigured) {
    return (
      <p className="text-sm text-danger">
        Sign-in isn&rsquo;t configured. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN and
        NEXT_PUBLIC_FIREBASE_PROJECT_ID.
      </p>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const auth = await clientAuth();
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await cred.user.getIdToken();
        const res = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        await signOut(auth); // the server cookie is the session now
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Sign-in failed.");
        }
        router.replace("/admin");
        router.refresh();
      } catch (err) {
        setError(message(err));
      }
    });
  };

  const reset = () => {
    setError(null);
    if (!email.trim()) return setError("Enter your email first, then press “Forgot password”.");
    startTransition(async () => {
      try {
        await sendPasswordResetEmail(await clientAuth(), email.trim());
      } catch {
        /* don't reveal whether the account exists */
      }
      setNotice("If that email has an account, a reset link is on its way.");
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <label className="block">
        <span className="mb-1.5 block text-sm">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
      </label>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-rose" role="status">
          {notice}
        </p>
      )}
      <button type="submit" disabled={pending || !email || !password} className="btn-primary mt-2 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button type="button" onClick={reset} disabled={pending} className="link-underline justify-self-center text-sm text-muted">
        Forgot password?
      </button>
    </form>
  );
}
