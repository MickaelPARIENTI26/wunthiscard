-- AlterTable: Add referral fields to User
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;
ALTER TABLE "User" ADD COLUMN "referralTicketCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "referralTotalTickets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "referralFreeTicketsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "referralFreeTicketsAvailable" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
