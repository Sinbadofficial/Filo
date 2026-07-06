import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  resellerPrice: z.number().positive(),
  deliveryCharge: z.number().nonnegative().default(60),
  stock: z.number().int().nonnegative().default(0),
});

export async function POST(request: Request) {
  const session = await requireSession(["SUPER_ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl || null,
        resellerPrice: body.resellerPrice,
        deliveryCharge: body.deliveryCharge,
        stock: body.stock,
      },
    });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
