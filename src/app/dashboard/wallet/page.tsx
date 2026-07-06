"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
};

type PaymentRequest = {
  id: string;
  amount: number;
  status: string;
  bkashNumber: string;
  createdAt: string;
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [bkash, setBkash] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [walletRes, reqRes, meRes] = await Promise.all([
      apiFetch<{ balance: number; transactions: Transaction[] }>("/api/wallet"),
      apiFetch<{ requests: PaymentRequest[] }>("/api/payment-requests"),
      apiFetch<{ user: { bkashNumber?: string | null } }>("/api/auth/me"),
    ]);
    setBalance(walletRes.balance);
    setTransactions(walletRes.transactions);
    setRequests(reqRes.requests);
    setBkash(meRes.user.bkashNumber || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function requestPayment(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/payment-requests", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          bkashNumber: bkash,
        }),
      });
      setMessage("Payment request submitted!");
      setAmount("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Wallet</h2>
      <p className="mt-2 text-slate-600">
        ডেলিভারি হলে প্রফিট যোগ হয়। রিটার্ন হলে ডেলিভারি চার্জ কাটা হয়।
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">{formatCurrency(balance)}</p>

          <form onSubmit={requestPayment} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h3 className="font-semibold">Payment Request</h3>
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                max={balance}
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">bKash Number</label>
              <input value={bkash} onChange={(e) => setBkash(e.target.value)} className="input" required />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            <button type="submit" className="btn-primary">Request Payment</button>
          </form>
        </div>

        <div className="card">
          <h3 className="font-semibold">Payment Requests</h3>
          <div className="mt-4 space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-medium">{formatCurrency(req.amount)}</p>
                  <p className="text-slate-500">{req.bkashNumber}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold">Transaction History</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="pb-2">Type</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Balance</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-slate-100">
                  <td className="py-2">{tx.type}</td>
                  <td className={`py-2 ${tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-2">{formatCurrency(tx.balanceAfter)}</td>
                  <td className="py-2 text-slate-500">{tx.description}</td>
                  <td className="py-2">{new Date(tx.createdAt).toLocaleString("en-BD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
