import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  creditProfitOnDelivery,
  deductDeliveryChargeOnReturn,
} from "@/lib/wallet";
import { notifyReseller } from "@/lib/notifications";

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

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        courierTrackingId: body.courierTrackingId ?? order.courierTrackingId,
        courierStatus: body.courierStatus ?? order.courierStatus,
        deliveredAt: body.status === "DELIVERED" ? new Date() : order.deliveredAt,
        returnedAt: body.status === "RETURNED" ? new Date() : order.returnedAt,
      },
      include: {
        items: true,
        reseller: { select: { id: true, name: true, shopName: true, phone: true } },
      },
    });

    if (body.status === "DELIVERED") {
      await creditProfitOnDelivery(updated);
      await notifyReseller(
        order.resellerId,
        order.reseller.phone,
        `ResellBD: অর্ডার ${order.orderNumber} ডেলিভারি হয়েছে! ৳${order.totalProfit} আপনার wallet-এ যোগ হয়েছে।`
      );
    }

    if (body.status === "RETURNED") {
      await deductDeliveryChargeOnReturn(updated);
      await notifyReseller(
        order.resellerId,
        order.reseller.phone,
        `ResellBD: অর্ডার ${order.orderNumber} রিটার্ন হয়েছে। ডেলিভারি চার্জ ৳${order.deliveryCharge} wallet থেকে কাটা হয়েছে।`
      );
    }

    const finalOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        reseller: { select: { id: true, name: true, shopName: true } },
      },
    });

    return NextResponse.json({ order: finalOrder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
