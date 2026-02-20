-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "drawnById" TEXT,
ADD COLUMN     "winnerNotified" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_drawnById_fkey" FOREIGN KEY ("drawnById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
