import { prisma } from "@/lib/prisma";
import type { Order, OrderStatus } from "@/generated/prisma/client";
import {
  creditProfitOnDelivery,
  deductDeliveryChargeOnReturn,
} from "@/lib/wallet";
import { notifyReseller } from "@/lib/notifications";

export async function applyOrderStatusChange(
  order: Order & { reseller?: { id: string; phone: string | null; name: string } },
  newStatus: OrderStatus,
  courierStatus?: string
) {
  if (order.status === newStatus && !courierStatus) {
    return order;
  }

  const skipWallet =
    (newStatus === "DELIVERED" && order.walletCredited) ||
    (newStatus === "RETURNED" && order.walletDeducted);

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      courierStatus: courierStatus ?? order.courierStatus,
      deliveredAt:
        newStatus === "DELIVERED" && !order.deliveredAt ? new Date() : order.deliveredAt,
      returnedAt:
        newStatus === "RETURNED" && !order.returnedAt ? new Date() : order.returnedAt,
    },
    include: {
      items: true,
      reseller: { select: { id: true, name: true, shopName: true, phone: true } },
    },
  });

  if (!skipWallet && newStatus === "DELIVERED") {
    await creditProfitOnDelivery(updated);
    await notifyReseller(
      order.resellerId,
      order.reseller?.phone,
      `ResellBD: অর্ডার ${order.orderNumber} ডেলিভারি হয়েছে! ৳${order.totalProfit} আপনার wallet-এ যোগ হয়েছে।`
    );
  }

  if (!skipWallet && newStatus === "RETURNED") {
    await deductDeliveryChargeOnReturn(updated);
    await notifyReseller(
      order.resellerId,
      order.reseller?.phone,
      `ResellBD: অর্ডার ${order.orderNumber} রিটার্ন হয়েছে। ডেলিভারি চার্জ ৳${order.deliveryCharge} wallet থেকে কাটা হয়েছে।`
    );
  }

  return updated;
}

export async function findOrderByPathaoPayload(payload: {
  consignment_id?: string;
  merchant_order_id?: string;
}) {
  if (payload.consignment_id) {
    const byTracking = await prisma.order.findFirst({
      where: { courierTrackingId: payload.consignment_id },
      include: { reseller: { select: { id: true, phone: true, name: true } } },
    });
    if (byTracking) return byTracking;
  }

  if (payload.merchant_order_id) {
    return prisma.order.findFirst({
      where: { orderNumber: payload.merchant_order_id },
      include: { reseller: { select: { id: true, phone: true, name: true } } },
    });
  }

  return null;
}
