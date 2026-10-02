-- AlterTable: add new columns first, backfill from the old ones, then
-- drop the old ones - this preserves each agent's actual "enabled" state
-- (most importantly keeping a disabled DM agent disabled) and gives each
-- agent its registry-matched hour instead of every row collapsing to the
-- same default the moment this migration runs.
ALTER TABLE "AgentDefinition"
ADD COLUMN     "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN     "hour" INTEGER NOT NULL DEFAULT 6;

UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 5 WHERE "key" = 'sync';
UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 6 WHERE "key" = 'analytics';
UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 7 WHERE "key" = 'trend';
UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 8 WHERE "key" = 'idea';
UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 9 WHERE "key" = 'planning';
UPDATE "AgentDefinition" SET "frequency" = CASE WHEN "enabled" THEN 'daily' ELSE 'off' END, "hour" = 10 WHERE "key" = 'dm';

ALTER TABLE "AgentDefinition" DROP COLUMN "enabled",
DROP COLUMN "schedule";

-- CreateTable
CREATE TABLE "AgentSettings" (
    "id" TEXT NOT NULL,
    "excludedTopics" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSettings_pkey" PRIMARY KEY ("id")
);
