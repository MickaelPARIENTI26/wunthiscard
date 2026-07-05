-- Lifecycle / marketing email support.
-- Idempotent (IF NOT EXISTS) so it can be safely re-applied to an already-patched DB.

-- Competition: per-blast idempotency guards
ALTER TABLE "Competition" ADD COLUMN IF NOT EXISTS "newCompEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Competition" ADD COLUMN IF NOT EXISTS "closingSoonEmailSentAt" TIMESTAMP(3);
ALTER TABLE "Competition" ADD COLUMN IF NOT EXISTS "resultsEmailSentAt" TIMESTAMP(3);

-- User: stable one-click unsubscribe token (no login needed to opt out of marketing)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unsubscribeToken" TEXT;

-- Backfill a token for every existing user so marketing blasts never have to
-- generate-and-persist on the hot path. gen_random_uuid() is built in on Neon/PG13+.
UPDATE "User" SET "unsubscribeToken" = gen_random_uuid()::text WHERE "unsubscribeToken" IS NULL;

-- Unique index (partial-safe: NULLs are allowed and not deduplicated by Postgres).
CREATE UNIQUE INDEX IF NOT EXISTS "User_unsubscribeToken_key" ON "User"("unsubscribeToken");
