-- Add missing User profile fields for onboarding and W-9

-- W-9 / Tax info fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9BusinessName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9BusinessType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9TaxId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9Address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9City" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9State" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9Zip" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "w9SignedAt" TIMESTAMP(3);

-- Professional profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "headshotUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emergencyContactRelation" TEXT;

-- Additional profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "languages" TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teachingStylePreferences" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "availabilityNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "previousExperience" TEXT;

-- ATS link fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "atsCandidateId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "atsApplicationId" TEXT;

-- Password reset fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);

-- Add indexes
CREATE INDEX IF NOT EXISTS "User_atsCandidateId_idx" ON "User"("atsCandidateId");
