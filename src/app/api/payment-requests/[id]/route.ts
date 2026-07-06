import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { payoutPaymentRequest } from "@/lib/wallet";

const updateSchema = z.object({
  action: z.enum(["approve", "reject", "pay"]),
  adminNote: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession(["SUPER_ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = updateSchema.parse(await request.json());

    if (body.action === "reject") {
      const updated = await prisma.paymentRequest.update({
        where: { id },
        data: { status: "REJECTED", adminNote: body.adminNote },
      });
      return NextResponse.json({ paymentRequest: updated });
    }

    if (body.action === "approve") {
      const updated = await prisma.paymentRequest.update({
        where: { id },
        data: { status: "APPROVED", adminNote: body.adminNote },
      });
      return NextResponse.json({ paymentRequest: updated });
    }

    await payoutPaymentRequest(id, body.adminNote);
    const updated = await prisma.paymentRequest.findUnique({ where: { id } });
    return NextResponse.json({ paymentRequest: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update request" },
      { status: 500 }
    );
  }
}
