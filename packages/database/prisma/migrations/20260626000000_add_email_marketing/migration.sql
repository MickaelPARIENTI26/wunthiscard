-- AlterTable
-- PECR opt-in for promotional / new-competition emails. Transactional emails
-- (order confirmations, draw results, win notifications) are always sent and are
-- not governed by this flag. Defaults to false (no marketing without explicit opt-in).
-- Idempotent (IF NOT EXISTS) so this is safe to apply by hand in the Neon SQL
-- editor AND still reconcile cleanly when `prisma migrate deploy` later records it.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailMarketing" BOOLEAN NOT NULL DEFAULT false;
