import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.findFirst();
  if (existing) {
    return NextResponse.json({ message: "Already seeded", skipped: true });
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  const resellerPassword = await bcrypt.hash("reseller123", 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@resellbd.com",
        password: adminPassword,
        name: "Super Admin",
        role: "SUPER_ADMIN",
      },
      {
        email: "reseller@demo.com",
        password: resellerPassword,
        name: "Demo Reseller",
        shopName: "রহিমা কালেকশন",
        phone: "01700000000",
        bkashNumber: "01700000000",
        role: "RESELLER",
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Matte Lipstick",
        description: "Long lasting matte lipstick",
        resellerPrice: 250,
        deliveryCharge: 60,
        stock: 100,
      },
      {
        name: "Vitamin C Serum",
        description: "Brightening face serum 30ml",
        resellerPrice: 450,
        deliveryCharge: 60,
        stock: 80,
      },
      {
        name: "Cotton Kurti",
        description: "Stylish cotton kurti",
        resellerPrice: 600,
        deliveryCharge: 80,
        stock: 50,
      },
    ],
  });

  return NextResponse.json({ message: "Database seeded successfully" });
}
