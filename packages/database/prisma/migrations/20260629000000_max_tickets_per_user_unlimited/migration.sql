-- Per-user ticket limit: 0 now means "no limit". Change the column default to 0 and
-- lift the cap on existing PAID competitions (free competitions keep their limit so
-- the free-entry route can't be farmed). Idempotent / safe to re-run.
ALTER TABLE "Competition" ALTER COLUMN "maxTicketsPerUser" SET DEFAULT 0;
UPDATE "Competition" SET "maxTicketsPerUser" = 0 WHERE "isFree" = false;
