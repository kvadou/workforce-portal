-- CreateEnum
CREATE TYPE "PointsCategory" AS ENUM ('TEACHING', 'QUALITY', 'LEARNING', 'ENGAGEMENT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "LiveSessionCategory" AS ENUM ('TRAINING', 'Q_AND_A', 'WORKSHOP', 'OFFICE_HOURS', 'SPECIAL_EVENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'POINTS_MILESTONE';
ALTER TYPE "NotificationType" ADD VALUE 'LEADERBOARD_CHANGE';

-- CreateTable
CREATE TABLE "tutor_points" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "coursePoints" INTEGER NOT NULL DEFAULT 0,
    "lessonPoints" INTEGER NOT NULL DEFAULT 0,
    "streakPoints" INTEGER NOT NULL DEFAULT 0,
    "achievementPoints" INTEGER NOT NULL DEFAULT 0,
    "qualityPoints" INTEGER NOT NULL DEFAULT 0,
    "engagementPoints" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PointsCategory" NOT NULL,
    "trigger" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "threshold" INTEGER,
    "multiplier" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "points_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_history" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" "PointsCategory" NOT NULL,
    "ruleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT,
    "zoomMeetingId" TEXT,
    "zoomJoinUrl" TEXT,
    "zoomStartUrl" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "maxParticipants" INTEGER NOT NULL DEFAULT 100,
    "category" "LiveSessionCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_registrations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_session_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,

    CONSTRAINT "live_session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tutor_points_tutorProfileId_key" ON "tutor_points"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_points_totalPoints_idx" ON "tutor_points"("totalPoints");

-- CreateIndex
CREATE INDEX "tutor_points_monthlyPoints_idx" ON "tutor_points"("monthlyPoints");

-- CreateIndex
CREATE INDEX "points_rules_category_idx" ON "points_rules"("category");

-- CreateIndex
CREATE INDEX "points_rules_isActive_idx" ON "points_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "points_rules_trigger_key" ON "points_rules"("trigger");

-- CreateIndex
CREATE INDEX "points_history_tutorProfileId_idx" ON "points_history"("tutorProfileId");

-- CreateIndex
CREATE INDEX "points_history_category_idx" ON "points_history"("category");

-- CreateIndex
CREATE INDEX "points_history_createdAt_idx" ON "points_history"("createdAt");

-- CreateIndex
CREATE INDEX "live_sessions_scheduledAt_idx" ON "live_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "live_sessions_isActive_idx" ON "live_sessions"("isActive");

-- CreateIndex
CREATE INDEX "live_sessions_hostId_idx" ON "live_sessions"("hostId");

-- CreateIndex
CREATE INDEX "live_session_registrations_sessionId_idx" ON "live_session_registrations"("sessionId");

-- CreateIndex
CREATE INDEX "live_session_registrations_userId_idx" ON "live_session_registrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_registrations_sessionId_userId_key" ON "live_session_registrations"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "live_session_attendance_sessionId_idx" ON "live_session_attendance"("sessionId");

-- CreateIndex
CREATE INDEX "live_session_attendance_userId_idx" ON "live_session_attendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_attendance_sessionId_userId_key" ON "live_session_attendance"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "tutor_points" ADD CONSTRAINT "tutor_points_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_registrations" ADD CONSTRAINT "live_session_registrations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
