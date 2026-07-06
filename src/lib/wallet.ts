import { prisma } from "@/lib/prisma";
import type { Order, WalletTransactionType } from "@/generated/prisma/client";

async function addWalletTransaction(
  userId: string,
  type: WalletTransactionType,
  amount: number,
  description: string,
  orderId?: string,
  paymentRequestId?: string
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const balanceAfter = user.walletBalance + amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: balanceAfter },
    }),
    prisma.walletTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter,
        description,
        orderId,
        paymentRequestId,
      },
    }),
  ]);

  return balanceAfter;
}

export async function creditProfitOnDelivery(order: Order) {
  if (order.walletCredited || order.status !== "DELIVERED") return;

  await addWalletTransaction(
    order.resellerId,
    "PROFIT",
    order.totalProfit,
    `Profit from order ${order.orderNumber}`,
    order.id
  );

  await prisma.order.update({
    where: { id: order.id },
    data: { walletCredited: true, deliveredAt: order.deliveredAt ?? new Date() },
  });
}

export async function deductDeliveryChargeOnReturn(order: Order) {
  if (order.walletDeducted || order.status !== "RETURNED") return;

  await addWalletTransaction(
    order.resellerId,
    "DELIVERY_CHARGE_DEDUCTION",
    -order.deliveryCharge,
    `Delivery charge deducted for returned order ${order.orderNumber}`,
    order.id
  );

  await prisma.order.update({
    where: { id: order.id },
    data: { walletDeducted: true, returnedAt: order.returnedAt ?? new Date() },
  });
}

export async function payoutPaymentRequest(
  paymentRequestId: string,
  adminNote?: string
) {
  const request = await prisma.paymentRequest.findUniqueOrThrow({
    where: { id: paymentRequestId },
    include: { user: true },
  });

  if (request.status === "PAID") {
    throw new Error("Payment already processed");
  }

  if (request.amount > request.user.walletBalance) {
    throw new Error("Insufficient wallet balance");
  }

  await addWalletTransaction(
    request.userId,
    "PAYMENT_PAYOUT",
    -request.amount,
    `Payout to bKash ${request.bkashNumber}`,
    undefined,
    paymentRequestId
  );

  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      adminNote,
    },
  });
}
