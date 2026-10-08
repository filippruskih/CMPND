-- DropForeignKey
ALTER TABLE "CompetitorSnapshot" DROP CONSTRAINT "CompetitorSnapshot_competitorId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitorMedia" DROP CONSTRAINT "CompetitorMedia_competitorId_fkey";

-- DropTable
DROP TABLE "Competitor";

-- DropTable
DROP TABLE "CompetitorSnapshot";

-- DropTable
DROP TABLE "CompetitorMedia";
