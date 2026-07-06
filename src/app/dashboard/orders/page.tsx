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

type OrderItemInput = {
  resellerProductId: string;
  quantity: number;
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
  courierProvider?: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState<OrderItemInput[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

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

  function addToCart() {
    if (!selectedProduct) return;
    const existing = cartItems.find((i) => i.resellerProductId === selectedProduct);
    if (existing) {
      setCartItems(
        cartItems.map((i) =>
          i.resellerProductId === selectedProduct
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      setCartItems([...cartItems, { resellerProductId: selectedProduct, quantity }]);
    }
    setSelectedProduct("");
    setQuantity(1);
  }

  function removeFromCart(id: string) {
    setCartItems(cartItems.filter((i) => i.resellerProductId !== id));
  }

  const cartTotal = cartItems.reduce((sum, item) => {
    const product = shopProducts.find((p) => p.id === item.resellerProductId);
    return sum + (product ? product.sellingPrice * item.quantity : 0);
  }, 0);

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("অন্তত একটি পণ্য যোগ করুন");
      return;
    }

    const form = new FormData(e.currentTarget);

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
          items: cartItems,
        }),
      });
      setShowForm(false);
      setCartItems([]);
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
          <p className="mt-2 text-slate-600">এক অর্ডারে একাধিক পণ্য — Pathao/Steadfast auto-connect</p>
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
              <p>Courier: {order.courierProvider || "—"}</p>
              <p>Tracking: {order.courierTrackingId || "—"}</p>
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
            <h3 className="text-lg font-semibold">নতুন অর্ডার (Multi-item)</h3>

            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">পণ্য যোগ করুন</p>
              <div className="mt-2 flex gap-2">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="input flex-1"
                >
                  <option value="">Select product</option>
                  {shopProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product.name} — {formatCurrency(p.sellingPrice)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input w-20"
                />
                <button type="button" onClick={addToCart} className="btn-secondary">
                  Add
                </button>
              </div>

              {cartItems.length > 0 && (
                <div className="mt-3 space-y-2">
                  {cartItems.map((item) => {
                    const p = shopProducts.find((s) => s.id === item.resellerProductId);
                    return (
                      <div key={item.resellerProductId} className="flex items-center justify-between text-sm">
                        <span>{p?.product.name} x{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.resellerProductId)}
                          className="text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  <p className="font-semibold text-emerald-600">Total: {formatCurrency(cartTotal)}</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
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
                  <option value="steadfast">Steadfast</option>
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
              <button
                type="button"
                onClick={() => { setShowForm(false); setCartItems([]); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
