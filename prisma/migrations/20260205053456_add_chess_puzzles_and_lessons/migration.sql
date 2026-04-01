-- CreateEnum
CREATE TYPE "LevelGoalType" AS ENUM ('CAPTURE_TARGETS', 'REACH_SQUARE', 'CHECKMATE', 'AVOID_CAPTURE', 'SEQUENCE', 'CUSTOM');

-- AlterEnum
ALTER TYPE "MilestoneType" ADD VALUE 'PUZZLES_SOLVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModuleContentType" ADD VALUE 'CHESS_PUZZLE';
ALTER TYPE "ModuleContentType" ADD VALUE 'CHESS_LESSON';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PUZZLE_MILESTONE';

-- AlterEnum
ALTER TYPE "StreakType" ADD VALUE 'PUZZLES_DAILY';

-- CreateTable
CREATE TABLE "chess_puzzles" (
    "id" TEXT NOT NULL,
    "lichessId" TEXT,
    "fen" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "themes" TEXT[],
    "openingTags" TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "nbPlays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chess_puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzle_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL,
    "usedHint" BOOLEAN NOT NULL DEFAULT false,
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzle_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_puzzle_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleRating" INTEGER NOT NULL DEFAULT 1200,
    "puzzlesSolved" INTEGER NOT NULL DEFAULT 0,
    "puzzlesFailed" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalTimeMs" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "themeProgress" JSONB NOT NULL DEFAULT '{}',
    "lastPuzzleAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_puzzle_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chess_lesson_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chess_lesson_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chess_lessons" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "iconEmoji" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chess_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chess_lesson_levels" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "fen" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "goalType" "LevelGoalType" NOT NULL,
    "targetSquares" TEXT[],
    "playerColor" TEXT NOT NULL DEFAULT 'white',
    "hintText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chess_lesson_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chess_lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedLevels" INTEGER NOT NULL DEFAULT 0,
    "totalLevels" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chess_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chess_puzzles_lichessId_key" ON "chess_puzzles"("lichessId");

-- CreateIndex
CREATE INDEX "chess_puzzles_rating_idx" ON "chess_puzzles"("rating");

-- CreateIndex
CREATE INDEX "chess_puzzles_isActive_idx" ON "chess_puzzles"("isActive");

-- CreateIndex
CREATE INDEX "chess_puzzles_themes_idx" ON "chess_puzzles"("themes");

-- CreateIndex
CREATE INDEX "puzzle_attempts_userId_idx" ON "puzzle_attempts"("userId");

-- CreateIndex
CREATE INDEX "puzzle_attempts_puzzleId_idx" ON "puzzle_attempts"("puzzleId");

-- CreateIndex
CREATE INDEX "puzzle_attempts_userId_puzzleId_idx" ON "puzzle_attempts"("userId", "puzzleId");

-- CreateIndex
CREATE INDEX "puzzle_attempts_createdAt_idx" ON "puzzle_attempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_puzzle_stats_userId_key" ON "user_puzzle_stats"("userId");

-- CreateIndex
CREATE INDEX "user_puzzle_stats_puzzleRating_idx" ON "user_puzzle_stats"("puzzleRating");

-- CreateIndex
CREATE INDEX "user_puzzle_stats_puzzlesSolved_idx" ON "user_puzzle_stats"("puzzlesSolved");

-- CreateIndex
CREATE UNIQUE INDEX "chess_lesson_categories_slug_key" ON "chess_lesson_categories"("slug");

-- CreateIndex
CREATE INDEX "chess_lesson_categories_order_idx" ON "chess_lesson_categories"("order");

-- CreateIndex
CREATE INDEX "chess_lessons_categoryId_idx" ON "chess_lessons"("categoryId");

-- CreateIndex
CREATE INDEX "chess_lessons_order_idx" ON "chess_lessons"("order");

-- CreateIndex
CREATE INDEX "chess_lesson_levels_lessonId_idx" ON "chess_lesson_levels"("lessonId");

-- CreateIndex
CREATE INDEX "chess_lesson_levels_order_idx" ON "chess_lesson_levels"("order");

-- CreateIndex
CREATE INDEX "chess_lesson_progress_userId_idx" ON "chess_lesson_progress"("userId");

-- CreateIndex
CREATE INDEX "chess_lesson_progress_lessonId_idx" ON "chess_lesson_progress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "chess_lesson_progress_userId_lessonId_key" ON "chess_lesson_progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "chess_puzzles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_puzzle_stats" ADD CONSTRAINT "user_puzzle_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chess_lessons" ADD CONSTRAINT "chess_lessons_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "chess_lesson_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chess_lesson_levels" ADD CONSTRAINT "chess_lesson_levels_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "chess_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chess_lesson_progress" ADD CONSTRAINT "chess_lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chess_lesson_progress" ADD CONSTRAINT "chess_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "chess_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
