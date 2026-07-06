"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  totalProfit: number;
  deliveryCharge: number;
  courierTrackingId?: string | null;
  reseller: { name: string; shopName?: string | null };
};

const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const res = await apiFetch<{ orders: Order[] }>("/api/orders");
    setOrders(res.orders);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
      <p className="mt-2 text-slate-600">
        DELIVERED মার্ক করলে রিসেলারের ওয়ালেটে প্রফিট যোগ হবে। RETURNED হলে ডেলিভারি চার্জ কাটা হবে।
      </p>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  Reseller: {order.reseller.shopName || order.reseller.name}
                </p>
                <p className="text-sm text-slate-500">
                  {order.customerName} • {order.customerPhone}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span>Amount: {formatCurrency(order.totalAmount)}</span>
              <span>Profit: {formatCurrency(order.totalProfit)}</span>
              <span>Return charge: {formatCurrency(order.deliveryCharge)}</span>
              <span>Tracking: {order.courierTrackingId || "—"}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(order.id, status)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    order.status === status
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
