"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  resellerPrice: number;
  deliveryCharge: number;
  stock: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await apiFetch<{ products: Product[] }>("/api/products");
    setProducts(res.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

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
          imageUrl: imageUrl || undefined,
          resellerPrice: Number(form.get("resellerPrice")),
          deliveryCharge: Number(form.get("deliveryCharge") || 60),
          stock: Number(form.get("stock") || 0),
        }),
      });
      e.currentTarget.reset();
      setImageUrl("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Products</h2>
      <p className="mt-2 text-slate-600">পণ্য যোগ করুন — ছবি upload সহ</p>

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
          <label className="label">Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="input" />
          {uploading && <p className="mt-1 text-sm text-slate-500">Uploading...</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-24 rounded-lg object-cover" />
          )}
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
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Reseller Price</th>
              <th className="px-4 py-3">Return Charge</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    "—"
                  )}
                </td>
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
