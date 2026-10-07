"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveResourceAction } from "@/app/admin/actions";
import { PRODUCTION_TEAM_ID, type Resource, type ResourceKind, type ServicePackage } from "@/lib/booking/types";
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
  /** Studio spaces: minimum booking in half-hours. */
  minSlots: string;
  /** Services: one package per line, "Label | minutes | price | studio or outdoor | per person". */
  packages: string;
  /** Services: studio space ids an indoor package can use, one per line. */
  rooms: string;
};

const packageLine = (p: ServicePackage) =>
  [p.label, p.slots * 30, p.price, p.location, ...(p.perPerson ? ["per person"] : [])].join(" | ");

/** Parses the packages box. Returns an error message for the first line it can't read. */
function parsePackages(text: string): ServicePackage[] | string {
  const out: ServicePackage[] = [];
  for (const line of lines(text)) {
    const [label, mins, price, location, per] = line.split("|").map((x) => x.trim());
    const minutes = Number(mins);
    if (!label || !Number.isInteger(minutes) || minutes <= 0 || minutes % 30 || !/^\d+$/.test(price ?? "") || !["studio", "outdoor"].includes(location)) {
      return `Can't read "${line}". Use: Label | minutes (30, 60, 240…) | price | studio or outdoor | per person (optional)`;
    }
    out.push({
      id: slugify(label),
      label,
      slots: minutes / 30,
      price: Number(price),
      location: location as ServicePackage["location"],
      ...(per?.toLowerCase() === "per person" && { perPerson: true }),
    });
  }
  return out;
}

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

const categoryDefault: Record<ResourceKind, string> = { equipment: "", studio: "Studio", workshop: "Workshop", service: "Production" };

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
    minSlots: String(r?.minSlots ?? 1),
    packages: (r?.packages ?? []).map(packageLine).join("\n"),
    rooms: (r?.rooms ?? []).join("\n"),
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
  const isService = d.kind === "service";
  const isTeam = resource?.id === PRODUCTION_TEAM_ID;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const packages = isService ? parsePackages(d.packages) : [];
    if (typeof packages === "string") {
      setErrors({ packages: [packages] });
      toast.error("Please fix the packages.");
      return;
    }
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
        // A service's rate is its cheapest package (the "from" price).
        dailyRate: isService ? (packages.length ? Math.min(...packages.map((p) => p.price)) : 0) : Number(d.dailyRate),
        stock: Number(d.stock),
        sortOrder: Number(d.sortOrder),
        active: d.active,
        ...(isWorkshop && { date: d.date, startTime: d.startTime, endTime: d.endTime, host: d.host }),
        ...(d.kind === "studio" && { minSlots: Number(d.minSlots) }),
        ...(isService && { packages, rooms: lines(d.rooms) }),
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
            {(["equipment", "studio", "service", "workshop"] as const).map((k) => (
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
          d.kind === "workshop"
            ? `/community/workshops/${d.slug || "…"}`
            : d.kind === "equipment"
              ? `/equipment/${d.slug || "…"}`
              : `/studio/${d.slug || "…"}`,
        )}
        {field("category", "Category", text("category", { placeholder: "Cameras, Lighting, Audio…" }))}
        {!isService &&
          field(
            "dailyRate",
            isWorkshop ? "Price per seat (R)" : d.kind === "studio" ? "Rate per 30 minutes (R)" : "Day rate (R)",
            text("dailyRate", { inputMode: "numeric", placeholder: "1250" }),
            "Whole Rand",
          )}
        {d.kind === "studio" &&
          field(
            "minSlots",
            "Minimum booking (half-hours)",
            text("minSlots", { inputMode: "numeric" }),
            "1 = 30 minutes, 2 = 1 hour",
          )}
        {d.kind !== "studio" &&
          (!isService || isTeam) &&
          field(
            "stock",
            isWorkshop ? "Seats" : isTeam ? "Crews" : "Units in stock",
            text("stock", { inputMode: "numeric" }),
            isWorkshop ? undefined : isTeam ? "How many shoots can run at the same time" : "How many identical units can be hired at once",
          )}
        {field("sortOrder", "Sort order", text("sortOrder", { inputMode: "numeric" }), "Lower shows first")}
      </div>

      {isService && !isTeam && (
        <div className="grid gap-6">
          {field(
            "packages",
            "Packages",
            <textarea
              value={d.packages}
              onChange={(e) => set("packages", e.target.value)}
              rows={4}
              className="field resize-y font-mono text-sm"
              placeholder={"4-hour indoor shoot | 240 | 5000 | studio\n30 minutes per person | 30 | 1000 | studio | per person"}
            />,
            "One per line: Label | minutes | price (R) | studio or outdoor | per person (optional). Every booking holds the production team; studio packages also hold a room.",
          )}
          {field(
            "rooms",
            "Rooms",
            <textarea value={d.rooms} onChange={(e) => set("rooms", e.target.value)} rows={2} className="field resize-y font-mono text-sm" placeholder="white-studio" />,
            "Studio space ids a studio package can use, one per line. With several, the customer picks.",
          )}
        </div>
      )}

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
          placeholder="/equipment/canon-eos-c400.webp"
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
