-- DropIndex
DROP INDEX "WheelSpin_orderId_idx";

-- AlterTable
ALTER TABLE "JackpotWin" ADD COLUMN     "paymentReversedAt" TIMESTAMP(3),
ADD COLUMN     "paymentReversedReason" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WheelSpin" ADD COLUMN     "reversalReason" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "JackpotWin_paymentReversedAt_idx" ON "JackpotWin"("paymentReversedAt");

-- CreateIndex
CREATE INDEX "WheelSpin_orderId_reversedAt_idx" ON "WheelSpin"("orderId", "reversedAt");
