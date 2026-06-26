-- AlterTable
-- PECR opt-in for promotional / new-competition emails. Transactional emails
-- (order confirmations, draw results, win notifications) are always sent and are
-- not governed by this flag. Defaults to false (no marketing without explicit opt-in).
ALTER TABLE "User" ADD COLUMN "emailMarketing" BOOLEAN NOT NULL DEFAULT false;
