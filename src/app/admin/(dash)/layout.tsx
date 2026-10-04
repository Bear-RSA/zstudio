import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { getAdmin } from "@/lib/admin/auth";

// Chrome only. Each page and action still calls requireAdmin() itself: Next can skip
// re-rendering a shared layout on client navigation, so this is not the security boundary.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-line lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/admin" className="wordmark text-[15px]">
              Z STUDIOS
            </Link>
            <p className="eyebrow lg:mt-1">Dashboard</p>
          </div>
          <AdminNav />
          <div className="mt-auto hidden border-t border-line pt-4 text-xs text-muted lg:block">
            <p className="truncate" title={admin.email}>
              {admin.email}
            </p>
            {!admin.devBypass && <SignOutButton />}
            <Link href="/" className="link-underline mt-2 block">
              View site ↗
            </Link>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {admin.devBypass && (
          <p className="border-b border-rose/40 bg-rose/10 px-4 py-2 text-xs text-rose sm:px-8">
            Dev mode: Firebase isn&rsquo;t configured, so sign-in is skipped and data is in memory. This never happens in
            production.
          </p>
        )}
        <main className="px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
