"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type ShopProduct = {
  id: string;
  sellingPrice: number;
  product: { name: string; resellerPrice: number };
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  totalAmount: number;
  totalProfit: number;
  courierTrackingId?: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [ordersRes, shopRes] = await Promise.all([
      apiFetch<{ orders: Order[] }>("/api/orders"),
      apiFetch<{ shopProducts: ShopProduct[] }>("/api/shop"),
    ]);
    setOrders(ordersRes.orders);
    setShopProducts(shopRes.shopProducts);
  }

  useEffect(() => {
    load();
  }, []);

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const resellerProductId = form.get("resellerProductId") as string;

    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          customerAddress: form.get("customerAddress"),
          customerCity: form.get("customerCity") || "Dhaka",
          courierProvider: form.get("courierProvider") || "pathao",
          notes: form.get("notes"),
          items: [{ resellerProductId, quantity: Number(form.get("quantity") || 1) }],
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="mt-2 text-slate-600">অর্ডার তৈরি করুন — Pathao-তে অটো কানেক্ট হবে</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + New Order
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  {order.customerName} • {order.customerPhone}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-4">
              <p>Amount: <strong>{formatCurrency(order.totalAmount)}</strong></p>
              <p>Profit: <strong className="text-emerald-600">{formatCurrency(order.totalProfit)}</strong></p>
              <p>Tracking: {order.courierTrackingId || "—"}</p>
              <p>{new Date(order.createdAt).toLocaleString("en-BD")}</p>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={createOrder} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <h3 className="text-lg font-semibold">নতুন অর্ডার</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Product (from My Shop)</label>
                <select name="resellerProductId" className="input" required>
                  <option value="">Select product</option>
                  {shopProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product.name} — {formatCurrency(p.sellingPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input name="quantity" type="number" min={1} defaultValue={1} className="input" />
              </div>
              <div>
                <label className="label">Customer Name</label>
                <input name="customerName" required className="input" />
              </div>
              <div>
                <label className="label">Customer Phone</label>
                <input name="customerPhone" required className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea name="customerAddress" required className="input" rows={2} />
              </div>
              <div>
                <label className="label">City</label>
                <input name="customerCity" defaultValue="Dhaka" className="input" />
              </div>
              <div>
                <label className="label">Courier</label>
                <select name="courierProvider" className="input">
                  <option value="pathao">Pathao</option>
                  <option value="steadfast">Steadfast (manual)</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input name="notes" className="input" />
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button type="submit" className="btn-primary flex-1">Create Order</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
