import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession(["RESELLER"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { walletBalance: true },
  });

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    balance: user?.walletBalance ?? 0,
    transactions,
  });
}
