"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Stats = {
  resellers: number;
  products: number;
  orders: number;
  pendingPayments: number;
  totalProfitPaid: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiFetch<{ stats: Stats }>("/api/admin/stats").then((res) => setStats(res.stats));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
      <p className="mt-2 text-slate-600">প্ল্যাটফর্ম ওভারভিউ</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Resellers" value={stats?.resellers ?? 0} />
        <StatCard label="Active Products" value={stats?.products ?? 0} />
        <StatCard label="Total Orders" value={stats?.orders ?? 0} />
        <StatCard label="Pending Payments" value={stats?.pendingPayments ?? 0} />
        <StatCard label="Profit Credited" value={formatCurrency(stats?.totalProfitPaid ?? 0)} />
      </div>
    </div>
  );
}
