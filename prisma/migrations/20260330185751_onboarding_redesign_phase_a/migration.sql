-- AlterTable
ALTER TABLE "OnboardingJourneyStep" ADD COLUMN     "phase" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "OnboardingProgress" ADD COLUMN     "phase1CompletedAt" TIMESTAMP(3),
ADD COLUMN     "phase2CompletedAt" TIMESTAMP(3),
ADD COLUMN     "phase3CompletedAt" TIMESTAMP(3),
ADD COLUMN     "phase4CompletedAt" TIMESTAMP(3),
ADD COLUMN     "phase5CompletedAt" TIMESTAMP(3),
ADD COLUMN     "phase6CompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OnboardingQuizQuestion" ADD COLUMN     "videoPart" INTEGER;

-- CreateTable
CREATE TABLE "OnboardingVideoProgress" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "videoPart" INTEGER NOT NULL,
    "videoId" TEXT,
    "percentWatched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "videoCompletedAt" TIMESTAMP(3),
    "quizScore" INTEGER,
    "quizAttempts" INTEGER NOT NULL DEFAULT 0,
    "quizPassedAt" TIMESTAMP(3),
    "quizAnswers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingVideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingVideoProgress_progressId_idx" ON "OnboardingVideoProgress"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingVideoProgress_progressId_videoPart_key" ON "OnboardingVideoProgress"("progressId", "videoPart");

-- CreateIndex
CREATE INDEX "OnboardingJourneyStep_phase_idx" ON "OnboardingJourneyStep"("phase");

-- CreateIndex
CREATE INDEX "OnboardingQuizQuestion_videoPart_idx" ON "OnboardingQuizQuestion"("videoPart");

-- AddForeignKey
ALTER TABLE "OnboardingVideoProgress" ADD CONSTRAINT "OnboardingVideoProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "OnboardingProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
