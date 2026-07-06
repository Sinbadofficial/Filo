"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Me = { walletBalance: number; name: string; shopName?: string | null };

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState(0);
  const [shopCount, setShopCount] = useState(0);

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: Me }>("/api/auth/me"),
      apiFetch<{ orders: unknown[] }>("/api/orders"),
      apiFetch<{ shopProducts: unknown[] }>("/api/shop"),
    ]).then(([meRes, ordersRes, shopRes]) => {
      setMe(meRes.user);
      setOrders(ordersRes.orders.length);
      setShopCount(shopRes.shopProducts.length);
    });
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        স্বাগতম{me ? `, ${me.shopName || me.name}` : ""}
      </h2>
      <p className="mt-2 text-slate-600">
        ক্যাটালগ থেকে পণ্য বেছে আপনার শপে যোগ করুন, মার্কেটিং করুন, অর্ডার তৈরি করুন।
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Wallet Balance" value={formatCurrency(me?.walletBalance ?? 0)} />
        <StatCard label="My Shop Products" value={shopCount} />
        <StatCard label="Total Orders" value={orders} />
      </div>
    </div>
  );
}
