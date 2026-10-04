import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getStore } from "@/lib/booking/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function find(id: string) {
  return (await (await getStore()).listAllResources()).find((r) => r.id === id) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await find((await params).id);
  return { title: r ? `Edit ${r.name}` : "Not found" };
}

export default async function EditResourcePage({ params }: Props) {
  await requireAdmin();
  const resource = await find((await params).id);
  if (!resource) notFound();

  const publicHref =
    resource.kind === "equipment"
      ? `/equipment/${resource.slug}`
      : resource.kind === "workshop"
        ? `/community/workshops/${resource.slug}`
        : "/studio";

  return (
    <div>
      <Link href="/admin/inventory" className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> Inventory
      </Link>
      <div className="mt-4 mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">{resource.kind}</p>
          <h1 className="mt-1 font-display text-4xl">{resource.name}</h1>
        </div>
        {resource.active && (
          <Link href={publicHref} target="_blank" className="link-underline text-sm text-muted">
            View on site ↗
          </Link>
        )}
      </div>
      <ResourceForm resource={resource} />
    </div>
  );
}
