-- AlterTable
ALTER TABLE "Competition" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: make totalTickets nullable (null = unlimited for free competitions)
ALTER TABLE "Competition" ALTER COLUMN "totalTickets" DROP NOT NULL;
