"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { useCart, useHydrated } from "@/stores/cart";
import { formatRand } from "@/lib/money";
import { Media } from "./Media";
import { QtyStepper } from "./QtyStepper";

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/** Bottom sheet on phones, right-hand panel on desktop. Vaul handles drag + the iOS curve. */
export function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const setOpen = useCart((s) => s.setDrawerOpen);
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const hydrated = useHydrated();
  const desktop = useIsDesktop();

  const perDay = items.reduce((sum, i) => sum + i.dailyRate * i.qty, 0);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction={desktop ? "right" : "bottom"}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-bone/30" />
        <Drawer.Content
          aria-describedby={undefined}
          className={
            desktop
              ? "fixed top-0 right-0 bottom-0 z-50 flex w-[440px] flex-col border-l border-line bg-surface outline-none"
              : "fixed right-0 bottom-0 left-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[10px] border-t border-line bg-surface outline-none"
          }
        >
          {!desktop && <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line-strong" />}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <Drawer.Title className="font-display text-2xl">Your hire</Drawer.Title>
            <Drawer.Close className="press -mr-2 p-2 text-muted" aria-label="Close">
              <X size={18} />
            </Drawer.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {!hydrated || items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-display text-xl text-bone">Nothing here yet.</p>
                <p className="mt-2 text-sm text-muted">Add gear or the studio to start a booking.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <Link href="/equipment" className="btn-ghost" onClick={() => setOpen(false)}>
                    Browse equipment
                  </Link>
                  <Link href="/studio" className="btn-ghost" onClick={() => setOpen(false)}>
                    Book the studio
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.resourceId} className="flex gap-4 py-4">
                    <Media src={item.image} alt={item.name} sizes="80px" className="h-20 w-20 shrink-0 rounded-lg" label=" " />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="eyebrow">{item.category}</p>
                          <p className="truncate text-[15px]">{item.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.resourceId)}
                          className="press -mt-1 -mr-1 p-1 text-muted"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        {item.stock > 1 ? (
                          <QtyStepper
                            value={item.qty}
                            max={item.stock}
                            onChange={(q) => setQty(item.resourceId, q)}
                            label={`${item.name} quantity`}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-xs text-muted">{item.kind === "studio" ? "Full day" : "×1"}</span>
                        )}
                        <span className="text-sm text-muted tabular-nums">{formatRand(item.dailyRate * item.qty)}/day</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hydrated && items.length > 0 && (
            <div className="border-t border-line px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="eyebrow">Per day</span>
                <span className="font-display text-2xl tabular-nums">{formatRand(perDay)}</span>
              </div>
              <Link href="/book/dates" className="btn-primary w-full" onClick={() => setOpen(false)}>
                Choose dates
              </Link>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
