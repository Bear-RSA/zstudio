import type { Metadata } from "next";
import { listEquipment, toCartItem } from "@/lib/booking/catalog";
import { EquipmentGrid } from "./EquipmentGrid";

export const metadata: Metadata = {
  title: "Equipment hire",
  description: "Hire cinema cameras, lenses, lighting, backdrops and audio by the day in Cape Town.",
};
export const revalidate = 300;

export default async function EquipmentPage() {
  const equipment = await listEquipment();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
      <p className="eyebrow">Equipment hire</p>
      <h1 className="mt-3 font-display text-[clamp(40px,6vw,72px)] leading-none">The Kit Room</h1>
      <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
        Gear is collected and returned Monday to Friday, and weekends and public holidays aren&rsquo;t charged. Add what you need, then pick your dates: the calendar
        only offers days the whole kit is free. Rates exclude VAT and insurance.
      </p>
      <EquipmentGrid
        items={equipment.map((r) => ({ ...toCartItem(r), description: r.description }))}
      />
    </div>
  );
}
