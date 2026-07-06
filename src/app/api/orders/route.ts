import { NextResponse } from "next/server";
import { createPathaoOrder } from "@/lib/pathao";
import { createSteadfastOrder } from "@/lib/steadfast";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateOrderNumber } from "@/lib/utils";
import { notifyReseller } from "@/lib/notifications";
import { z } from "zod";

const itemSchema = z.object({
  resellerProductId: z.string(),
  quantity: z.number().int().positive().default(1),
});

const schema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(11),
  customerAddress: z.string().min(5),
  customerCity: z.string().default("Dhaka"),
  courierProvider: z.enum(["pathao", "steadfast"]).default("pathao"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.role === "SUPER_ADMIN" ? {} : { resellerId: session.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      reseller: { select: { id: true, name: true, shopName: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

async function bookCourier(
  provider: "pathao" | "steadfast",
  payload: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    amountToCollect: number;
    itemDescription: string;
    orderNumber: string;
  }
) {
  if (provider === "steadfast") {
    return createSteadfastOrder({
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerAddress: payload.customerAddress,
      amountToCollect: payload.amountToCollect,
      itemDescription: payload.itemDescription,
      orderNumber: payload.orderNumber,
    });
  }

  return createPathaoOrder({
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    customerCity: payload.customerCity,
    amountToCollect: payload.amountToCollect,
    itemDescription: payload.itemDescription,
    orderNumber: payload.orderNumber,
  });
}

export async function POST(request: Request) {
  const session = await requireSession(["RESELLER"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());

    const shopItems = await prisma.resellerProduct.findMany({
      where: {
        id: { in: body.items.map((i) => i.resellerProductId) },
        userId: session.id,
        isActive: true,
      },
      include: { product: true },
    });

    if (shopItems.length !== body.items.length) {
      return NextResponse.json({ error: "Invalid shop items" }, { status: 400 });
    }

    let totalAmount = 0;
    let totalResellerCost = 0;
    let totalProfit = 0;
    let maxDeliveryCharge = 60;

    const orderItemsData = body.items.map((item) => {
      const shopItem = shopItems.find((s) => s.id === item.resellerProductId)!;
      const lineSelling = shopItem.sellingPrice * item.quantity;
      const lineCost = shopItem.product.resellerPrice * item.quantity;
      const lineProfit = lineSelling - lineCost;

      totalAmount += lineSelling;
      totalResellerCost += lineCost;
      totalProfit += lineProfit;
      maxDeliveryCharge = Math.max(maxDeliveryCharge, shopItem.product.deliveryCharge);

      return {
        productId: shopItem.productId,
        productName: shopItem.product.name,
        quantity: item.quantity,
        resellerPrice: shopItem.product.resellerPrice,
        sellingPrice: shopItem.sellingPrice,
        profit: lineProfit,
      };
    });

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        resellerId: session.id,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress,
        customerCity: body.customerCity,
        totalAmount,
        totalResellerCost,
        totalProfit,
        deliveryCharge: maxDeliveryCharge,
        courierProvider: body.courierProvider,
        notes: body.notes,
        status: "PENDING",
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    const courierResult = await bookCourier(body.courierProvider, {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCity: body.customerCity,
      amountToCollect: totalAmount,
      itemDescription: orderItemsData.map((i) => `${i.productName} x${i.quantity}`).join(", "),
      orderNumber,
    });

    if (courierResult.success && courierResult.trackingId) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          courierTrackingId: courierResult.trackingId,
          courierStatus: courierResult.message,
          status: "CONFIRMED",
        },
      });
    }

    const reseller = await prisma.user.findUnique({ where: { id: session.id } });
    await notifyReseller(
      session.id,
      reseller?.phone,
      `ResellBD: অর্ডার ${orderNumber} তৈরি হয়েছে। ${body.courierProvider.toUpperCase()} tracking: ${courierResult.trackingId || "pending"}`
    );

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
