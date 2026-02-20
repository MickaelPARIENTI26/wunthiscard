-- CreateTable
CREATE TABLE "DrawLog" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "competitionTitle" TEXT NOT NULL,
    "totalTickets" INTEGER NOT NULL,
    "ticketsSold" INTEGER NOT NULL,
    "winningTicketNumber" INTEGER NOT NULL,
    "winnerUserId" TEXT,
    "winnerName" TEXT NOT NULL,
    "winnerEmail" TEXT NOT NULL,
    "drawnById" TEXT NOT NULL,
    "drawnByRole" TEXT NOT NULL,
    "drawMethod" TEXT NOT NULL DEFAULT 'crypto.randomInt',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DrawLog_competitionId_idx" ON "DrawLog"("competitionId");

-- CreateIndex
CREATE INDEX "DrawLog_drawnById_idx" ON "DrawLog"("drawnById");

-- CreateIndex
CREATE INDEX "DrawLog_createdAt_idx" ON "DrawLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DrawLog" ADD CONSTRAINT "DrawLog_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawLog" ADD CONSTRAINT "DrawLog_drawnById_fkey" FOREIGN KEY ("drawnById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
