"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  resellerPrice: number;
  deliveryCharge: number;
  stock: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await apiFetch<{ products: Product[] }>("/api/products");
    setProducts(res.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          resellerPrice: Number(form.get("resellerPrice")),
          deliveryCharge: Number(form.get("deliveryCharge") || 60),
          stock: Number(form.get("stock") || 0),
        }),
      });
      e.currentTarget.reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Products</h2>
      <p className="mt-2 text-slate-600">পণ্য যোগ করুন — রিসেলাররা ক্যাটালগে দেখবে</p>

      <form onSubmit={createProduct} className="card mt-8 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Product Name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Reseller Price (৳)</label>
          <input name="resellerPrice" type="number" required className="input" />
        </div>
        <div>
          <label className="label">Delivery Charge on Return (৳)</label>
          <input name="deliveryCharge" type="number" defaultValue={60} className="input" />
        </div>
        <div>
          <label className="label">Stock</label>
          <input name="stock" type="number" defaultValue={0} className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" className="input" rows={2} />
        </div>
        {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary">Add Product</button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Reseller Price</th>
              <th className="px-4 py-3">Return Charge</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{formatCurrency(p.resellerPrice)}</td>
                <td className="px-4 py-3">{formatCurrency(p.deliveryCharge)}</td>
                <td className="px-4 py-3">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
