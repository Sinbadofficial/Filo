import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const schema = z.object({
  productId: z.string(),
  sellingPrice: z.number().positive(),
});

export async function GET() {
  const session = await requireSession(["RESELLER"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopProducts = await prisma.resellerProduct.findMany({
    where: { userId: session.id, isActive: true },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ shopProducts });
}

export async function POST(request: Request) {
  const session = await requireSession(["RESELLER"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const product = await prisma.product.findUnique({ where: { id: body.productId } });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (body.sellingPrice <= product.resellerPrice) {
      return NextResponse.json(
        { error: "Selling price must be higher than reseller price" },
        { status: 400 }
      );
    }

    const shopProduct = await prisma.resellerProduct.upsert({
      where: {
        userId_productId: {
          userId: session.id,
          productId: body.productId,
        },
      },
      update: {
        sellingPrice: body.sellingPrice,
        isActive: true,
      },
      create: {
        userId: session.id,
        productId: body.productId,
        sellingPrice: body.sellingPrice,
      },
      include: { product: true },
    });

    return NextResponse.json({ shopProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add to shop" }, { status: 500 });
  }
}
