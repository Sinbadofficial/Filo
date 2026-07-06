import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBkashTransaction } from "@/lib/bkash";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { payoutPaymentRequest } from "@/lib/wallet";
import { notifyReseller } from "@/lib/notifications";

const schema = z.object({
  trxId: z.string().min(8),
  paymentRequestId: z.string().optional(),
  amount: z.number().positive().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(["SUPER_ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const result = await verifyBkashTransaction(body.trxId, body.amount);

    if (!result.verified) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    if (body.paymentRequestId) {
      const paymentRequest = await prisma.paymentRequest.findUnique({
        where: { id: body.paymentRequestId },
        include: { user: true },
      });

      if (!paymentRequest) {
        return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
      }

      await prisma.paymentRequest.update({
        where: { id: body.paymentRequestId },
        data: { bkashTrxId: body.trxId, verifiedAt: new Date() },
      });

      if (paymentRequest.status !== "PAID") {
        await payoutPaymentRequest(body.paymentRequestId, `Auto-verified bKash: ${body.trxId}`);
        await notifyReseller(
          paymentRequest.userId,
          paymentRequest.user.phone,
          `ResellBD: ৳${paymentRequest.amount} আপনার bKash (${paymentRequest.bkashNumber})-এ পাঠানো হয়েছে। TrxID: ${body.trxId}`
        );
      }
    }

    return NextResponse.json({ ...result, verified: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
