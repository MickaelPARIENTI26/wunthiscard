-- AlterTable
-- Marks the referee's qualifying first purchase that granted the referrer a free
-- ticket, so a full refund / lost dispute can claw the reward back. Idempotent for
-- safe manual application.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "grantedReferralReward" BOOLEAN NOT NULL DEFAULT false;
