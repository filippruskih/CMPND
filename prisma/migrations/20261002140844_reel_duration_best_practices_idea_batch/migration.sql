-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "durationMs" INTEGER;

-- CreateTable
CREATE TABLE "BestPractice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sourceAgentRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "BestPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaBatch" (
    "id" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nicheIdeasJson" TEXT NOT NULL,
    "freshIdeasJson" TEXT NOT NULL,
    "sourceAgentRunId" TEXT,

    CONSTRAINT "IdeaBatch_pkey" PRIMARY KEY ("id")
);

