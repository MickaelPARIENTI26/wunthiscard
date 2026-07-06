-- Abandoned-cart recovery email idempotency guard.
-- Idempotent so it can be safely re-applied.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recoveryEmailSentAt" TIMESTAMP(3);
