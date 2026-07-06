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

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ products: Product[] }>("/api/products").then((res) =>
      setProducts(res.products)
    );
  }, []);

  async function addToShop(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setMessage("");

    try {
      await apiFetch("/api/shop", {
        method: "POST",
        body: JSON.stringify({
          productId: selected.id,
          sellingPrice: Number(sellingPrice),
        }),
      });
      setMessage(`${selected.name} আপনার শপে যোগ হয়েছে!`);
      setSelected(null);
      setSellingPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Product Catalog</h2>
      <p className="mt-2 text-slate-600">সব পণ্য দেখুন এবং আপনার শপে যোগ করুন</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="card">
            <div className="flex h-32 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                "No image"
              )}
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{product.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{product.description}</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>Reseller Price: <strong>{formatCurrency(product.resellerPrice)}</strong></p>
              <p>Delivery Charge (return): {formatCurrency(product.deliveryCharge)}</p>
              <p>Stock: {product.stock}</p>
            </div>
            <button
              onClick={() => {
                setSelected(product);
                setSellingPrice(String(product.resellerPrice + 100));
              }}
              className="btn-primary mt-4 w-full"
            >
              Add to My Shop
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={addToShop} className="card w-full max-w-md">
            <h3 className="text-lg font-semibold">{selected.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Reseller price: {formatCurrency(selected.resellerPrice)}
            </p>
            <div className="mt-4">
              <label className="label">আপনার বিক্রয় মূল্য</label>
              <input
                type="number"
                min={selected.resellerPrice + 1}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="input"
                required
              />
              {sellingPrice && (
                <p className="mt-2 text-sm text-emerald-600">
                  আপনার প্রফিট: {formatCurrency(Number(sellingPrice) - selected.resellerPrice)}
                </p>
              )}
            </div>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
            <div className="mt-6 flex gap-3">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
