-- AlterTable: one-time referral reward guard.
-- Each referee can reward their referrer exactly once (on their first paid order).
ALTER TABLE "User" ADD COLUMN "referralRewardGranted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any existing referee who has ALREADY completed a successful purchase
-- must be marked as granted, so the rule change does not retroactively hand out a
-- new +1 on their next purchase.
UPDATE "User"
SET "referralRewardGranted" = true
WHERE "referredById" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "Order" o
    WHERE o."userId" = "User"."id"
      AND o."paymentStatus" = 'SUCCEEDED'
  );
