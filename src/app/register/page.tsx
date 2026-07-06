"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          phone: form.get("phone"),
          shopName: form.get("shopName"),
          bkashNumber: form.get("bkashNumber"),
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Reseller Register</h1>
        <p className="mt-2 text-sm text-slate-500">আপনার শপ খুলুন</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">নাম</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">Shop Name</label>
            <input name="shopName" className="input" placeholder="রহিমা কালেকশন" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="input" placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="label">bKash Number</label>
            <input name="bkashNumber" className="input" placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required minLength={6} className="input" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have account?{" "}
          <Link href="/login" className="font-medium text-emerald-600">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
