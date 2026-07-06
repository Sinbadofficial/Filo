"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type PaymentRequest = {
  id: string;
  amount: number;
  status: string;
  bkashNumber: string;
  createdAt: string;
  user: { name: string; email: string; phone?: string | null };
};

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  async function load() {
    const res = await apiFetch<{ requests: PaymentRequest[] }>("/api/payment-requests");
    setRequests(res.requests);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject" | "pay") {
    await apiFetch(`/api/payment-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Payment Requests</h2>
      <p className="mt-2 text-slate-600">রিসেলারের bKash-এ টাকা পাঠানোর রিকোয়েস্ট</p>

      <div className="mt-8 space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{req.user.name}</p>
                <p className="text-sm text-slate-500">{req.user.email}</p>
                <p className="mt-2 text-lg font-bold text-emerald-600">
                  {formatCurrency(req.amount)} → {req.bkashNumber}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>
            {req.status === "PENDING" && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleAction(req.id, "approve")} className="btn-secondary">
                  Approve
                </button>
                <button onClick={() => handleAction(req.id, "pay")} className="btn-primary">
                  Mark Paid (bKash sent)
                </button>
                <button
                  onClick={() => handleAction(req.id, "reject")}
                  className="rounded-lg px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Reject
                </button>
              </div>
            )}
            {req.status === "APPROVED" && (
              <div className="mt-4">
                <button onClick={() => handleAction(req.id, "pay")} className="btn-primary">
                  Mark Paid (bKash sent)
                </button>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-slate-500">No payment requests yet.</p>
        )}
      </div>
    </div>
  );
}
