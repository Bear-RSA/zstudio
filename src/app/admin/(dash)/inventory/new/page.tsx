import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Add item" };
// Admin pages must never be prerendered: the auth check has to run per request.
export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/inventory" className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> Inventory
      </Link>
      <h1 className="mt-4 mb-8 font-display text-4xl">Add item</h1>
      <ResourceForm />
    </div>
  );
}
