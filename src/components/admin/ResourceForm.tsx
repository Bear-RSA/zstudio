"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveResourceAction } from "@/app/admin/actions";
import type { Resource, ResourceKind } from "@/lib/booking/types";
import { cn } from "@/lib/cn";

type Draft = {
  kind: ResourceKind;
  name: string;
  slug: string;
  category: string;
  description: string;
  specs: string;
  images: string;
  dailyRate: string;
  stock: string;
  sortOrder: string;
  active: boolean;
  date: string;
  startTime: string;
  endTime: string;
  host: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const categoryDefault: Record<ResourceKind, string> = { equipment: "", studio: "Studio", workshop: "Workshop" };

function toDraft(r?: Resource): Draft {
  return {
    kind: r?.kind ?? "equipment",
    name: r?.name ?? "",
    slug: r?.slug ?? "",
    category: r?.category ?? "",
    description: r?.description ?? "",
    specs: (r?.specs ?? []).join("\n"),
    images: (r?.images ?? []).join("\n"),
    dailyRate: r ? String(r.dailyRate) : "",
    stock: r ? String(r.stock) : "1",
    sortOrder: r ? String(r.sortOrder) : "100",
    active: r?.active ?? true,
    date: r?.date ?? "",
    startTime: r?.startTime ?? "",
    endTime: r?.endTime ?? "",
    host: r?.host ?? "",
  };
}

export function ResourceForm({ resource }: { resource?: Resource }) {
  const router = useRouter();
  const isNew = !resource;
  const [d, setD] = useState<Draft>(() => toDraft(resource));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
  const err = (k: string) => errors[k]?.[0];
  const isWorkshop = d.kind === "workshop";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveResourceAction({
        id: resource?.id,
        kind: d.kind,
        name: d.name,
        slug: d.slug,
        category: d.category,
        description: d.description,
        specs: lines(d.specs),
        images: lines(d.images),
        dailyRate: Number(d.dailyRate),
        stock: Number(d.stock),
        sortOrder: Number(d.sortOrder),
        active: d.active,
        ...(isWorkshop && { date: d.date, startTime: d.startTime, endTime: d.endTime, host: d.host }),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      toast.success(res.message ?? "Saved");
      if (isNew && res.id) router.replace(`/admin/inventory/${res.id}`);
      router.refresh();
    });
  };

  const field = (k: keyof Draft, label: string, input: React.ReactNode, hint?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm">{label}</span>
      {input}
      {err(k) ? (
        <span className="mt-1 block text-xs text-danger" role="alert">
          {err(k)}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
  const text = (k: keyof Draft, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      {...props}
      value={d[k] as string}
      onChange={(e) => set(k, e.target.value as never)}
      aria-invalid={err(k) ? true : undefined}
      className="field"
    />
  );

  return (
    <form onSubmit={submit} noValidate className="grid max-w-3xl gap-6">
      {isNew && (
        <fieldset>
          <legend className="mb-2 text-sm">Type</legend>
          <div className="flex gap-2">
            {(["equipment", "studio", "workshop"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={d.kind === k}
                onClick={() =>
                  setD((prev) => ({
                    ...prev,
                    kind: k,
                    category: prev.category && prev.category !== categoryDefault[prev.kind] ? prev.category : categoryDefault[k],
                  }))
                }
                className={cn(
                  "press h-9 border px-4 text-[12px] tracking-[0.14em] uppercase",
                  d.kind === k ? "border-rose bg-rose/10 text-rose" : "border-line text-muted",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {field(
          "name",
          "Name",
          <input
            value={d.name}
            onChange={(e) => {
              const name = e.target.value;
              setD((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
            }}
            aria-invalid={err("name") ? true : undefined}
            className="field"
          />,
        )}
        {field(
          "slug",
          "URL slug",
          <input
            value={d.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            aria-invalid={err("slug") ? true : undefined}
            className="field font-mono text-sm"
          />,
          d.kind === "workshop" ? `/community/workshops/${d.slug || "…"}` : d.kind === "equipment" ? `/equipment/${d.slug || "…"}` : "Used in links",
        )}
        {field("category", "Category", text("category", { placeholder: "Cameras, Lighting, Audio…" }))}
        {field(
          "dailyRate",
          isWorkshop ? "Price per seat (R)" : "Day rate (R)",
          text("dailyRate", { inputMode: "numeric", placeholder: "1250" }),
          "Whole Rand",
        )}
        {d.kind !== "studio" &&
          field(
            "stock",
            isWorkshop ? "Seats" : "Units in stock",
            text("stock", { inputMode: "numeric" }),
            isWorkshop ? undefined : "How many identical units can be hired at once",
          )}
        {field("sortOrder", "Sort order", text("sortOrder", { inputMode: "numeric" }), "Lower shows first")}
      </div>

      {isWorkshop && (
        <div className="grid gap-6 sm:grid-cols-4">
          <div className="sm:col-span-2">{field("date", "Date", text("date", { type: "date" }))}</div>
          {field("startTime", "Starts", text("startTime", { type: "time" }))}
          {field("endTime", "Ends", text("endTime", { type: "time" }))}
          <div className="sm:col-span-4">{field("host", "Hosted by", text("host", { placeholder: "Z Studios" }))}</div>
        </div>
      )}

      {field(
        "description",
        "Description",
        <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={4} className="field resize-y" />,
      )}
      {field(
        "specs",
        isWorkshop ? "What's included" : "Specs",
        <textarea value={d.specs} onChange={(e) => set("specs", e.target.value)} rows={5} className="field resize-y" />,
        "One per line",
      )}
      {field(
        "images",
        "Images",
        <textarea
          value={d.images}
          onChange={(e) => set("images", e.target.value)}
          rows={3}
          className="field resize-y font-mono text-sm"
          placeholder="/equipment/sony-fx3.jpg"
        />,
        "One per line: a path under /public (e.g. /equipment/name.jpg) or a Cloudinary public ID. First is the main image.",
      )}

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={d.active}
          onChange={(e) => set("active", e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--color-rose)]"
        />
        <span>
          Visible on the website
          <span className="block text-xs text-muted">
            Unticked items are hidden and can&rsquo;t be booked. Existing bookings are kept.
          </span>
        </span>
      </label>

      <div className="flex gap-3 border-t border-line pt-6">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : isNew ? "Create" : "Save changes"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => router.push("/admin/inventory")}>
          Back
        </button>
      </div>
    </form>
  );
}
