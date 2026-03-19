-- AlterTable: Add mystery card fields to Competition
ALTER TABLE "Competition" ADD COLUMN "isMystery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Competition" ADD COLUMN "isRevealed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Competition" ADD COLUMN "minimumValue" DECIMAL(10,2);
ALTER TABLE "Competition" ADD COLUMN "teaser" TEXT;
ALTER TABLE "Competition" ADD COLUMN "realTitle" TEXT;
ALTER TABLE "Competition" ADD COLUMN "realValue" DECIMAL(10,2);
ALTER TABLE "Competition" ADD COLUMN "realImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Competition" ADD COLUMN "realCertification" TEXT;
ALTER TABLE "Competition" ADD COLUMN "realGrade" TEXT;
