-- Gamification System Tables (Phase 8)
-- UserBadge: Track earned badges
-- TutorStreak: Track login/lesson streaks
-- TutorMilestone: Track achievement milestones

-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('LOGIN', 'LESSONS_WEEKLY', 'LESSONS_DAILY');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('TOTAL_LESSONS', 'WEEKLY_LESSONS', 'TRIAL_CONVERSIONS', 'CLIENT_RETENTION', 'FIVE_STAR_RATINGS', 'TRAINING_COMPLETED');

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_streaks" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "type" "StreakType" NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_milestones" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "value" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "tutor_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE INDEX "user_badges_badgeId_idx" ON "user_badges"("badgeId");

-- CreateIndex
CREATE INDEX "user_badges_earnedAt_idx" ON "user_badges"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "tutor_streaks_tutorProfileId_idx" ON "tutor_streaks"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_streaks_type_idx" ON "tutor_streaks"("type");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_streaks_tutorProfileId_type_key" ON "tutor_streaks"("tutorProfileId", "type");

-- CreateIndex
CREATE INDEX "tutor_milestones_tutorProfileId_idx" ON "tutor_milestones"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_milestones_type_idx" ON "tutor_milestones"("type");

-- CreateIndex
CREATE INDEX "tutor_milestones_achievedAt_idx" ON "tutor_milestones"("achievedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_milestones_tutorProfileId_type_value_key" ON "tutor_milestones"("tutorProfileId", "type", "value");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "OnboardingBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_streaks" ADD CONSTRAINT "tutor_streaks_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_milestones" ADD CONSTRAINT "tutor_milestones_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
