"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/catalog", label: "Product Catalog" },
  { href: "/dashboard/shop", label: "My Shop" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/wallet", label: "Wallet" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar title="Reseller Panel" items={navItems} onLogout={logout} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
