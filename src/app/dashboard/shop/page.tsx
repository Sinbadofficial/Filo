"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type ShopProduct = {
  id: string;
  sellingPrice: number;
  product: {
    id: string;
    name: string;
    resellerPrice: number;
    deliveryCharge: number;
  };
};

export default function ShopPage() {
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);

  async function load() {
    const res = await apiFetch<{ shopProducts: ShopProduct[] }>("/api/shop");
    setShopProducts(res.shopProducts);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeItem(id: string) {
    await apiFetch(`/api/shop/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">My Shop</h2>
      <p className="mt-2 text-slate-600">আপনার শপের পণ্যগুলো — এগুলো দিয়ে অর্ডার তৈরি করুন</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Reseller Price</th>
              <th className="px-4 py-3">Your Price</th>
              <th className="px-4 py-3">Profit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {shopProducts.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{item.product.name}</td>
                <td className="px-4 py-3">{formatCurrency(item.product.resellerPrice)}</td>
                <td className="px-4 py-3">{formatCurrency(item.sellingPrice)}</td>
                <td className="px-4 py-3 text-emerald-600">
                  {formatCurrency(item.sellingPrice - item.product.resellerPrice)}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => removeItem(item.id)} className="text-rose-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {shopProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  কোনো পণ্য নেই। Catalog থেকে যোগ করুন।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
