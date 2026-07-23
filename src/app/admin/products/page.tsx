"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { compressImageFile } from "@/lib/compress-image";

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
  const [success, setSuccess] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await apiFetch<{ products: Product[] }>("/api/products");
    setProducts(res.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress("Compressing image...");

    try {
      const compressed = await compressImageFile(file);

      setUploadProgress("Uploading...");

      // Prefer JSON data URL (most reliable on mobile + Vercel)
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed.dataUrl }),
      });

      let data: { imageUrl?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Upload server error");
      }

      if (!res.ok) {
        // Fallback: multipart
        setUploadProgress("Retrying upload...");
        const formData = new FormData();
        formData.append("file", compressed.blob, "product.jpg");
        const retry = await fetch("/api/upload", { method: "POST", body: formData });
        const retryData = await retry.json();
        if (!retry.ok) throw new Error(retryData.error || data.error || "Upload failed");
        setImageUrl(retryData.imageUrl);
      } else {
        setImageUrl(data.imageUrl || "");
      }

      setSuccess("ছবি আপলোড হয়েছে ✓");
      setUploadProgress("");
    } catch (err) {
      setImageUrl("");
      setUploadProgress("");
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    // Allow re-selecting same file
    e.target.value = "";
  }

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
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
      setSuccess("পণ্য যোগ হয়েছে ✓");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Products</h2>
      <p className="mt-2 text-slate-600">পণ্য যোগ করুন — ছবি গ্যালারি বা ক্যামেরা থেকে</p>

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            capture="environment"
            onChange={handleImageUpload}
            className="input"
            disabled={uploading}
          />
          <p className="mt-1 text-xs text-slate-500">
            ফোন থেকে গ্যালারি বা ক্যামেরা দিয়ে ছবি দিন। JPG/PNG ভালো কাজ করে।
          </p>

          {uploading && (
            <p className="mt-2 text-sm text-emerald-600">
              {uploadProgress || "Uploading..."}
            </p>
          )}

          {imageUrl && (
            <div className="mt-3 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="h-28 w-28 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => {
                  setImageUrl("");
                  setSuccess("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove photo
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" className="input" rows={2} />
        </div>
        {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
        {success && <p className="text-sm text-emerald-600 md:col-span-2">{success}</p>}
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary" disabled={uploading}>
            Add Product
          </button>
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
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-10 w-10 rounded object-cover"
                    />
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
