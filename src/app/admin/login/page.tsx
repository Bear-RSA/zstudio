import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="wordmark block text-center text-lg">
          Z STUDIOS
        </Link>
        <p className="eyebrow mt-2 text-center">Staff dashboard</p>
        <div className="mt-10 border border-line bg-surface p-6 sm:p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Accounts are created in the Firebase console by the studio owner.
        </p>
      </div>
    </div>
  );
}
