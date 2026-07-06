import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  RETURNED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-rose-100 text-rose-800",
  PAID: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[status] || "bg-slate-100 text-slate-600"
      )}
    >
      {status}
    </span>
  );
}
