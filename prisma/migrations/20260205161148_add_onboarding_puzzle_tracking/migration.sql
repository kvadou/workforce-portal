-- AlterTable
ALTER TABLE "OnboardingProgress" ADD COLUMN     "puzzleBestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "puzzleCurrentRating" INTEGER NOT NULL DEFAULT 400,
ADD COLUMN     "puzzlesAttempted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "puzzlesSolved" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "onboarding_puzzle_attempts" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "usedHint" BOOLEAN NOT NULL DEFAULT false,
    "moveCount" INTEGER NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_puzzle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_puzzle_attempts_progressId_idx" ON "onboarding_puzzle_attempts"("progressId");

-- CreateIndex
CREATE INDEX "onboarding_puzzle_attempts_puzzleId_idx" ON "onboarding_puzzle_attempts"("puzzleId");

-- CreateIndex
CREATE INDEX "onboarding_puzzle_attempts_createdAt_idx" ON "onboarding_puzzle_attempts"("createdAt");

-- AddForeignKey
ALTER TABLE "onboarding_puzzle_attempts" ADD CONSTRAINT "onboarding_puzzle_attempts_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "OnboardingProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
