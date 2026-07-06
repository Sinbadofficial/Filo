import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const resellerPassword = await bcrypt.hash("reseller123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@resellbd.com" },
    update: {},
    create: {
      email: "admin@resellbd.com",
      password: adminPassword,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  const reseller = await prisma.user.upsert({
    where: { email: "reseller@demo.com" },
    update: {},
    create: {
      email: "reseller@demo.com",
      password: resellerPassword,
      name: "Demo Reseller",
      shopName: "রহিমা কালেকশন",
      phone: "01700000000",
      bkashNumber: "01700000000",
      role: "RESELLER",
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: "seed-lipstick" },
      update: {},
      create: {
        id: "seed-lipstick",
        name: "Matte Lipstick",
        description: "Long lasting matte lipstick",
        resellerPrice: 250,
        deliveryCharge: 60,
        stock: 100,
      },
    }),
    prisma.product.upsert({
      where: { id: "seed-serum" },
      update: {},
      create: {
        id: "seed-serum",
        name: "Vitamin C Serum",
        description: "Brightening face serum 30ml",
        resellerPrice: 450,
        deliveryCharge: 60,
        stock: 80,
      },
    }),
    prisma.product.upsert({
      where: { id: "seed-kurta" },
      update: {},
      create: {
        id: "seed-kurta",
        name: "Cotton Kurti",
        description: "Stylish cotton kurti",
        resellerPrice: 600,
        deliveryCharge: 80,
        stock: 50,
      },
    }),
  ]);

  console.log("Seed complete:");
  console.log("Admin:", admin.email, "/ admin123");
  console.log("Reseller:", reseller.email, "/ reseller123");
  console.log("Products:", products.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
