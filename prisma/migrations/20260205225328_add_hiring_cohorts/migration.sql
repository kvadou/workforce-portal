-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "hiring_cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CohortStatus" NOT NULL DEFAULT 'UPCOMING',
    "description" TEXT,
    "notes" TEXT,
    "orientationSessionId" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hiring_cohorts_name_key" ON "hiring_cohorts"("name");

-- CreateIndex
CREATE INDEX "hiring_cohorts_status_idx" ON "hiring_cohorts"("status");

-- CreateIndex
CREATE INDEX "hiring_cohorts_orientationSessionId_idx" ON "hiring_cohorts"("orientationSessionId");

-- CreateIndex
CREATE INDEX "cohort_members_cohortId_idx" ON "cohort_members"("cohortId");

-- CreateIndex
CREATE INDEX "cohort_members_tutorProfileId_idx" ON "cohort_members"("tutorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohortId_tutorProfileId_key" ON "cohort_members"("cohortId", "tutorProfileId");

-- AddForeignKey
ALTER TABLE "hiring_cohorts" ADD CONSTRAINT "hiring_cohorts_orientationSessionId_fkey" FOREIGN KEY ("orientationSessionId") REFERENCES "OrientationSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "hiring_cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
