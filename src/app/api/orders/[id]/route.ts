import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { applyOrderStatusChange } from "@/lib/order-status";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"]),
  courierTrackingId: z.string().optional(),
  courierStatus: z.string().optional(),
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
    const body = schema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id },
      include: { reseller: { select: { id: true, phone: true, name: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const finalOrder = await applyOrderStatusChange(
      order,
      body.status,
      body.courierStatus ??
        (body.courierTrackingId
          ? `Manual update | tracking: ${body.courierTrackingId}`
          : order.courierStatus ?? undefined)
    );

    if (body.courierTrackingId) {
      await prisma.order.update({
        where: { id },
        data: { courierTrackingId: body.courierTrackingId },
      });
    }

    const refreshed = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        reseller: { select: { id: true, name: true, shopName: true, phone: true } },
      },
    });

    return NextResponse.json({ order: refreshed ?? finalOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
