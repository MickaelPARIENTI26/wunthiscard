-- Pre-existing drift between schema.prisma and the databases, surfaced when the
-- wheel migration was generated. Split out so it can be reasoned about (and
-- rolled back) on its own rather than riding inside a feature migration.

-- Win used to allow a single winner per competition. The schema moved to
-- @@unique([competitionId, prizePosition]) for multi-prize draws, but this
-- older single-column unique was never dropped — it silently blocks recording
-- a second prize winner. The composite index already exists.
DROP INDEX IF EXISTS "Win_competitionId_key";

-- Cosmetic: the schema no longer declares a default for this array column.
ALTER TABLE "Competition" ALTER COLUMN "realImages" DROP DEFAULT;
