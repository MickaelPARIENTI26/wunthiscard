-- CreateEnum
CREATE TYPE "WheelSlotType" AS ENUM ('NO_WIN', 'PERCENT_OFF', 'JACKPOT');

-- CreateEnum
CREATE TYPE "JackpotStatus" AS ENUM ('PENDING', 'CONTACTED', 'ADDRESS_CONFIRMED', 'SHIPPED', 'DELIVERED');

-- CreateTable
CREATE TABLE "WheelConfig" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "jackpotEnabled" BOOLEAN NOT NULL DEFAULT true,
    "jackpotDescription" TEXT,
    "jackpotValue" DECIMAL(10,2),
    "couponValidityDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WheelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelSlot" (
    "id" TEXT NOT NULL,
    "wheelConfigId" TEXT NOT NULL,
    "type" "WheelSlotType" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "quantityConfigured" INTEGER NOT NULL,
    "quantityWon" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WheelSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WheelSpin" (
    "id" TEXT NOT NULL,
    "wheelConfigId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "ticketId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "spunAt" TIMESTAMP(3),
    "resultType" "WheelSlotType",
    "resultValue" INTEGER,

    CONSTRAINT "WheelSpin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "spinId" TEXT NOT NULL,
    "competitionId" TEXT,
    "percentOff" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedOrderId" TEXT,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JackpotWin" (
    "id" TEXT NOT NULL,
    "spinId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "status" "JackpotStatus" NOT NULL DEFAULT 'PENDING',
    "prizeDescription" TEXT NOT NULL,
    "prizeValue" DECIMAL(10,2),
    "adminNotes" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JackpotWin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WheelConfig_competitionId_key" ON "WheelConfig"("competitionId");

-- CreateIndex
CREATE INDEX "WheelSlot_wheelConfigId_idx" ON "WheelSlot"("wheelConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "WheelSlot_wheelConfigId_type_value_key" ON "WheelSlot"("wheelConfigId", "type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "WheelSpin_ticketId_key" ON "WheelSpin"("ticketId");

-- CreateIndex
CREATE INDEX "WheelSpin_competitionId_idx" ON "WheelSpin"("competitionId");

-- CreateIndex
CREATE INDEX "WheelSpin_userId_spunAt_idx" ON "WheelSpin"("userId", "spunAt");

-- CreateIndex
CREATE INDEX "WheelSpin_orderId_idx" ON "WheelSpin"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_spinId_key" ON "PromoCode"("spinId");

-- CreateIndex
CREATE INDEX "PromoCode_userId_redeemedAt_idx" ON "PromoCode"("userId", "redeemedAt");

-- CreateIndex
CREATE INDEX "PromoCode_competitionId_idx" ON "PromoCode"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "JackpotWin_spinId_key" ON "JackpotWin"("spinId");

-- CreateIndex
CREATE INDEX "JackpotWin_status_idx" ON "JackpotWin"("status");

-- CreateIndex
CREATE INDEX "JackpotWin_competitionId_idx" ON "JackpotWin"("competitionId");

-- AddForeignKey
ALTER TABLE "WheelConfig" ADD CONSTRAINT "WheelConfig_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSlot" ADD CONSTRAINT "WheelSlot_wheelConfigId_fkey" FOREIGN KEY ("wheelConfigId") REFERENCES "WheelConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_wheelConfigId_fkey" FOREIGN KEY ("wheelConfigId") REFERENCES "WheelConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WheelSpin" ADD CONSTRAINT "WheelSpin_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_spinId_fkey" FOREIGN KEY ("spinId") REFERENCES "WheelSpin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_redeemedOrderId_fkey" FOREIGN KEY ("redeemedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JackpotWin" ADD CONSTRAINT "JackpotWin_spinId_fkey" FOREIGN KEY ("spinId") REFERENCES "WheelSpin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JackpotWin" ADD CONSTRAINT "JackpotWin_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JackpotWin" ADD CONSTRAINT "JackpotWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JackpotWin" ADD CONSTRAINT "JackpotWin_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
