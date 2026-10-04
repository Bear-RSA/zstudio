"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      className="link-underline mt-2 block text-left disabled:opacity-50"
      onClick={async () => {
        setPending(true);
        await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
