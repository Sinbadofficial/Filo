"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payment Requests" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar title="Super Admin" items={navItems} onLogout={logout} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
