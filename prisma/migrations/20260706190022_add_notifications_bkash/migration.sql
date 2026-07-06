-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN "bkashTrxId" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN "verifiedAt" DATETIME;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
