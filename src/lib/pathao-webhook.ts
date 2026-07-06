import type { OrderStatus } from "@/generated/prisma/client";
import { applyOrderStatusChange, findOrderByPathaoPayload } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const PATHAO_WEBHOOK_SECRET_HEADER = "x-pathao-merchant-webhook-integration-secret";

export type PathaoWebhookPayload = {
  event: string;
  consignment_id?: string;
  merchant_order_id?: string;
  collected_amount?: number;
  delivery_fee?: number;
  reason?: string;
  updated_at?: string;
  timestamp?: string;
};

const SHIPPED_EVENTS = new Set([
  "order.picked",
  "order.in-transit",
  "order.at-the-sorting-hub",
  "order.received-at-last-mile-hub",
  "order.assigned-for-delivery",
  "order.assigned-for-pickup",
]);

const CONFIRMED_EVENTS = new Set([
  "order.created",
  "order.updated",
  "order.pickup-requested",
]);

export function mapPathaoEventToStatus(event: string): OrderStatus | null {
  if (event === "order.delivered" || event === "order.partial-delivery") {
    return "DELIVERED";
  }
  if (event === "order.returned" || event === "order.paid-return") {
    return "RETURNED";
  }
  if (event === "order.cancelled" || event === "order.pickup-cancelled") {
    return "CANCELLED";
  }
  if (SHIPPED_EVENTS.has(event)) {
    return "SHIPPED";
  }
  if (CONFIRMED_EVENTS.has(event)) {
    return "CONFIRMED";
  }
  return null;
}

export function buildCourierStatusLabel(payload: PathaoWebhookPayload): string {
  const parts = [`Pathao: ${payload.event}`];
  if (payload.collected_amount != null) {
    parts.push(`COD ৳${payload.collected_amount}`);
  }
  if (payload.reason) {
    parts.push(payload.reason);
  }
  return parts.join(" | ");
}

export function getPathaoWebhookSecret() {
  return process.env.PATHAO_WEBHOOK_SECRET || process.env.PATHAO_CLIENT_SECRET || "";
}

export function pathaoWebhookResponseHeaders(): Record<string, string> {
  const secret = getPathaoWebhookSecret();
  if (!secret) return {};
  return { [PATHAO_WEBHOOK_SECRET_HEADER]: secret };
}

export async function logPathaoWebhook(
  payload: PathaoWebhookPayload,
  orderId?: string,
  processed = false
) {
  return prisma.pathaoWebhookLog.create({
    data: {
      event: payload.event,
      consignmentId: payload.consignment_id,
      merchantOrderId: payload.merchant_order_id,
      orderId,
      payload: JSON.stringify(payload),
      processed,
    },
  });
}

export async function processPathaoWebhook(payload: PathaoWebhookPayload) {
  if (payload.event === "webhook_integration") {
    return { handled: true, handshake: true };
  }

  const mappedStatus = mapPathaoEventToStatus(payload.event);
  if (!mappedStatus) {
    await logPathaoWebhook(payload, undefined, false);
    return { handled: false, reason: "unmapped_event" };
  }

  const order = await findOrderByPathaoPayload(payload);
  if (!order) {
    await logPathaoWebhook(payload, undefined, false);
    return { handled: false, reason: "order_not_found" };
  }

  if (order.courierProvider && order.courierProvider !== "pathao") {
    await logPathaoWebhook(payload, order.id, false);
    return { handled: false, reason: "not_pathao_order" };
  }

  const courierStatus = buildCourierStatusLabel(payload);

  await applyOrderStatusChange(order, mappedStatus, courierStatus);
  await logPathaoWebhook(payload, order.id, true);

  return {
    handled: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: mappedStatus,
  };
}
