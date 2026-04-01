-- Tutor Management Tables Migration
-- Creates the tutor profile system for Story Time Tutors

-- Create Enums
CREATE TYPE "TutorStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'QUIT', 'TERMINATED');
CREATE TYPE "TutorTeam" AS ENUM ('LA', 'NYC', 'SF', 'ONLINE', 'WESTSIDE', 'EASTSIDE');
CREATE TYPE "TutorCertType" AS ENUM ('SCHOOL_CERTIFIED', 'BQ_CERTIFIED', 'PLAYGROUP_CERTIFIED', 'CHESSABLE_COMPLETED', 'BACKGROUND_CHECK', 'ADVANCED_CHESS', 'LEAD_TUTOR');
CREATE TYPE "TutorCertStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'REVOKED');
CREATE TYPE "TutorNoteType" AS ENUM ('GENERAL', 'PERFORMANCE', 'INCIDENT', 'FEEDBACK', 'ADMIN');

-- Create tutor_profiles table
CREATE TABLE "tutor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tutorCruncherId" INTEGER,
    "branchId" TEXT,
    "chessableUsername" TEXT,
    "pronouns" TEXT,
    "hireDate" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "status" "TutorStatus" NOT NULL DEFAULT 'PENDING',
    "team" "TutorTeam",
    "isSchoolCertified" BOOLEAN NOT NULL DEFAULT false,
    "isBqCertified" BOOLEAN NOT NULL DEFAULT false,
    "isPlaygroupCertified" BOOLEAN NOT NULL DEFAULT false,
    "baseHourlyRate" DECIMAL(10,2),
    "chessLevel" TEXT,
    "chessRating" INTEGER,
    "noctieRating" INTEGER,
    "chessableProgress" INTEGER DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "lastLessonDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_profiles_pkey" PRIMARY KEY ("id")
);

-- Create tutor_certifications table
CREATE TABLE "tutor_certifications" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "type" "TutorCertType" NOT NULL,
    "status" "TutorCertStatus" NOT NULL DEFAULT 'PENDING',
    "earnedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_certifications_pkey" PRIMARY KEY ("id")
);

-- Create tutor_labels table
CREATE TABLE "tutor_labels" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "tutor_labels_pkey" PRIMARY KEY ("id")
);

-- Create tutor_notes table
CREATE TABLE "tutor_notes" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "TutorNoteType" NOT NULL DEFAULT 'GENERAL',
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_notes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_userId_key" UNIQUE ("userId");
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_tutorCruncherId_key" UNIQUE ("tutorCruncherId");
ALTER TABLE "tutor_certifications" ADD CONSTRAINT "tutor_certifications_tutorProfileId_type_key" UNIQUE ("tutorProfileId", "type");
ALTER TABLE "tutor_labels" ADD CONSTRAINT "tutor_labels_tutorProfileId_name_key" UNIQUE ("tutorProfileId", "name");

-- Create indexes
CREATE INDEX "tutor_profiles_tutorCruncherId_idx" ON "tutor_profiles"("tutorCruncherId");
CREATE INDEX "tutor_profiles_status_idx" ON "tutor_profiles"("status");
CREATE INDEX "tutor_profiles_team_idx" ON "tutor_profiles"("team");

CREATE INDEX "tutor_certifications_tutorProfileId_idx" ON "tutor_certifications"("tutorProfileId");
CREATE INDEX "tutor_certifications_type_idx" ON "tutor_certifications"("type");
CREATE INDEX "tutor_certifications_expiresAt_idx" ON "tutor_certifications"("expiresAt");

CREATE INDEX "tutor_labels_tutorProfileId_idx" ON "tutor_labels"("tutorProfileId");
CREATE INDEX "tutor_labels_name_idx" ON "tutor_labels"("name");

CREATE INDEX "tutor_notes_tutorProfileId_idx" ON "tutor_notes"("tutorProfileId");
CREATE INDEX "tutor_notes_type_idx" ON "tutor_notes"("type");
CREATE INDEX "tutor_notes_createdAt_idx" ON "tutor_notes"("createdAt");

-- Add foreign keys
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_certifications" ADD CONSTRAINT "tutor_certifications_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_labels" ADD CONSTRAINT "tutor_labels_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_notes" ADD CONSTRAINT "tutor_notes_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
