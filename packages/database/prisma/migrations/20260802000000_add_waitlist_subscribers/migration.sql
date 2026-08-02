-- Pre-launch waiting list (coming-soon gate signups)
CREATE TABLE IF NOT EXISTS "waitlist_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    CONSTRAINT "waitlist_subscribers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_subscribers_email_key" ON "waitlist_subscribers"("email");
