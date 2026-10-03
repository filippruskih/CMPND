-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "statsJson" TEXT NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "sourceAgentRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

