-- Onboarding System Tables Migration

-- Create enums
CREATE TYPE "OnboardingStatus" AS ENUM (
  'PENDING', 'WELCOME', 'VIDEOS_IN_PROGRESS', 'QUIZ_PENDING', 'QUIZ_FAILED',
  'PROFILE_PENDING', 'W9_PENDING', 'AWAITING_ORIENTATION', 'ORIENTATION_SCHEDULED',
  'POST_ORIENTATION_TRAINING', 'SHADOW_LESSONS', 'COMPLETED', 'ACTIVATED', 'RETURNED'
);
CREATE TYPE "QuizQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE');
CREATE TYPE "ConfigValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- OrientationSession table (needed for OnboardingProgress FK)
CREATE TABLE "OrientationSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 90,
    "zoomLink" TEXT,
    "zoomMeetingId" TEXT,
    "hostId" TEXT,
    "hostName" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrientationSession_pkey" PRIMARY KEY ("id")
);

-- OnboardingProgress table
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "welcomeCompletedAt" TIMESTAMP(3),
    "videosCompletedAt" TIMESTAMP(3),
    "quizPassedAt" TIMESTAMP(3),
    "profileCompletedAt" TIMESTAMP(3),
    "w9CompletedAt" TIMESTAMP(3),
    "orientationAttendedAt" TIMESTAMP(3),
    "trainingCompletedAt" TIMESTAMP(3),
    "shadowCompletedAt" TIMESTAMP(3),
    "videoProgress" JSONB NOT NULL DEFAULT '[]',
    "quizScore" INTEGER,
    "quizAttempts" INTEGER NOT NULL DEFAULT 0,
    "quizLastAttemptAt" TIMESTAMP(3),
    "quizAnswers" JSONB,
    "trainingSessions" JSONB NOT NULL DEFAULT '[]',
    "shadowLessons" JSONB NOT NULL DEFAULT '[]',
    "adminNotes" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "orientationSessionId" TEXT,
    "backgroundCheckStatus" TEXT,
    "backgroundCheckCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- OnboardingVideo table
CREATE TABLE "OnboardingVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vimeoId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingVideo_pkey" PRIMARY KEY ("id")
);

-- OnboardingQuizQuestion table
CREATE TABLE "OnboardingQuizQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" "QuizQuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- OnboardingConfig table
CREATE TABLE "OnboardingConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "ConfigValueType" NOT NULL DEFAULT 'STRING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingConfig_pkey" PRIMARY KEY ("id")
);

-- OnboardingJourneyStep table
CREATE TABLE "OnboardingJourneyStep" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "icon" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "requiredStatus" TEXT NOT NULL,
    "completionField" TEXT NOT NULL,
    "badgeType" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingJourneyStep_pkey" PRIMARY KEY ("id")
);

-- OnboardingBadge table
CREATE TABLE "OnboardingBadge" (
    "id" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "colorScheme" TEXT NOT NULL,
    "unlockType" TEXT NOT NULL,
    "unlockCondition" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingBadge_pkey" PRIMARY KEY ("id")
);

-- OnboardingDropdownOption table
CREATE TABLE "OnboardingDropdownOption" (
    "id" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingDropdownOption_pkey" PRIMARY KEY ("id")
);

-- OnboardingOrientationAgenda table
CREATE TABLE "OnboardingOrientationAgenda" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OnboardingOrientationAgenda_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_key" UNIQUE ("userId");
ALTER TABLE "OnboardingConfig" ADD CONSTRAINT "OnboardingConfig_key_key" UNIQUE ("key");
ALTER TABLE "OnboardingBadge" ADD CONSTRAINT "OnboardingBadge_badgeKey_key" UNIQUE ("badgeKey");

-- Create indexes
CREATE INDEX "OrientationSession_scheduledAt_idx" ON "OrientationSession"("scheduledAt");
CREATE INDEX "OrientationSession_isActive_idx" ON "OrientationSession"("isActive");

CREATE INDEX "OnboardingProgress_status_idx" ON "OnboardingProgress"("status");
CREATE INDEX "OnboardingProgress_orientationSessionId_idx" ON "OnboardingProgress"("orientationSessionId");

CREATE INDEX "OnboardingVideo_order_idx" ON "OnboardingVideo"("order");
CREATE INDEX "OnboardingVideo_isActive_idx" ON "OnboardingVideo"("isActive");

CREATE INDEX "OnboardingQuizQuestion_order_idx" ON "OnboardingQuizQuestion"("order");
CREATE INDEX "OnboardingQuizQuestion_isActive_idx" ON "OnboardingQuizQuestion"("isActive");
CREATE INDEX "OnboardingQuizQuestion_category_idx" ON "OnboardingQuizQuestion"("category");

CREATE INDEX "OnboardingConfig_category_idx" ON "OnboardingConfig"("category");

CREATE INDEX "OnboardingJourneyStep_order_idx" ON "OnboardingJourneyStep"("order");

-- Add foreign keys
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_orientationSessionId_fkey"
    FOREIGN KEY ("orientationSessionId") REFERENCES "OrientationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
