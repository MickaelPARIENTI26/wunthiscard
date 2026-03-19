-- AlterTable: Add multi-draw fields to Competition
ALTER TABLE "Competition" ADD COLUMN "drawType" TEXT NOT NULL DEFAULT 'single';
ALTER TABLE "Competition" ADD COLUMN "prizes" JSONB;

-- AlterTable: Update Win model for multi-draw
-- Drop the old unique constraint on competitionId
ALTER TABLE "Win" DROP CONSTRAINT IF EXISTS "Win_competitionId_key";

-- Add multi-draw fields to Win
ALTER TABLE "Win" ADD COLUMN "prizePosition" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Win" ADD COLUMN "prizeTitle" TEXT;
ALTER TABLE "Win" ADD COLUMN "prizeValue" DECIMAL(10,2);

-- CreateIndex: unique per competition + position
CREATE UNIQUE INDEX "Win_competitionId_prizePosition_key" ON "Win"("competitionId", "prizePosition");
CREATE INDEX "Win_competitionId_idx" ON "Win"("competitionId");
