"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/inventory", label: "Inventory" },
];

// No motion: staff switch sections constantly; the active state just changes colour.
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:mt-6 lg:flex-col" aria-label="Dashboard">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-[2px] px-3 py-2 text-sm",
              active ? "bg-raised text-bone" : "text-muted hover:text-bone",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
