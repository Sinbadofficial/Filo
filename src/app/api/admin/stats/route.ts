import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession(["SUPER_ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resellers, products, orders, paymentRequests] = await Promise.all([
    prisma.user.count({ where: { role: "RESELLER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.paymentRequest.count({ where: { status: "PENDING" } }),
  ]);

  const totalProfit = await prisma.walletTransaction.aggregate({
    where: { type: "PROFIT" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    stats: {
      resellers,
      products,
      orders,
      pendingPayments: paymentRequests,
      totalProfitPaid: totalProfit._sum.amount ?? 0,
    },
  });
}
