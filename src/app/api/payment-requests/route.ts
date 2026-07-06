import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const createSchema = z.object({
  amount: z.number().positive(),
  bkashNumber: z.string().min(11),
});

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.role === "SUPER_ADMIN" ? {} : { userId: session.id };

  const requests = await prisma.paymentRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await requireSession(["RESELLER"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });

    if (body.amount > user.walletBalance) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const pending = await prisma.paymentRequest.findFirst({
      where: { userId: session.id, status: "PENDING" },
    });

    if (pending) {
      return NextResponse.json(
        { error: "You already have a pending payment request" },
        { status: 400 }
      );
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId: session.id,
        amount: body.amount,
        bkashNumber: body.bkashNumber,
      },
    });

    return NextResponse.json({ paymentRequest });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
