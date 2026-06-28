-- AlterTable
-- Session-invalidation version. Bumped on password reset/change so that every JWT
-- issued before the change is rejected by the auth jwt callback (a stolen session no
-- longer survives a password reset). Idempotent for safe manual application.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
