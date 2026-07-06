"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

export function Sidebar({
  title,
  items,
  onLogout,
}: {
  title: string;
  items: NavItem[];
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          ResellBD
        </p>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname === item.href
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {onLogout && (
        <button
          onClick={onLogout}
          className="mt-8 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Logout
        </button>
      )}
    </aside>
  );
}
