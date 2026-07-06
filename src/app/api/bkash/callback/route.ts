import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyBkashTransaction } from "@/lib/bkash";
import { prisma } from "@/lib/prisma";
import { payoutPaymentRequest } from "@/lib/wallet";
import { notifyReseller } from "@/lib/notifications";

const schema = z.object({
  trxID: z.string(),
  amount: z.string().optional(),
  paymentRequestId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const amount = body.amount ? parseFloat(body.amount) : undefined;
    const result = await verifyBkashTransaction(body.trxID, amount);

    if (!result.verified) {
      return NextResponse.json({ status: "failed", message: result.message });
    }

    if (body.paymentRequestId) {
      const paymentRequest = await prisma.paymentRequest.findUnique({
        where: { id: body.paymentRequestId },
        include: { user: true },
      });

      if (paymentRequest && paymentRequest.status !== "PAID") {
        await prisma.paymentRequest.update({
          where: { id: body.paymentRequestId },
          data: { bkashTrxId: body.trxID, verifiedAt: new Date() },
        });
        await payoutPaymentRequest(body.paymentRequestId, `bKash webhook: ${body.trxID}`);
        await notifyReseller(
          paymentRequest.userId,
          paymentRequest.user.phone,
          `ResellBD: ৳${paymentRequest.amount} bKash-এ পাঠানো হয়েছে। TrxID: ${body.trxID}`
        );
      }
    }

    return NextResponse.json({ status: "success", ...result });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
