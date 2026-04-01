-- Add EmailTemplate table and missing schema fields

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "slug" TEXT,
ADD COLUMN     "wpSourceId" INTEGER;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "wpSourceId" INTEGER;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "wpSourceId" INTEGER;

-- AlterTable
ALTER TABLE "OnboardingOrientationAgenda" DROP COLUMN IF EXISTS "duration";

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "draftContent" TEXT,
ADD COLUMN     "hasDraft" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "roleTitle" TEXT,
    "description" TEXT NOT NULL,
    "nextSteps" TEXT[],
    "nextStepsIntro" TEXT,
    "requiresOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_templateKey_key" ON "EmailTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "EmailTemplate_templateKey_idx" ON "EmailTemplate"("templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_wpSourceId_key" ON "Course"("wpSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_wpSourceId_key" ON "Lesson"("wpSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_wpSourceId_key" ON "Module"("wpSourceId");

-- CreateIndex
CREATE INDEX "OnboardingBadge_order_idx" ON "OnboardingBadge"("order");

-- CreateIndex
CREATE INDEX "OnboardingDropdownOption_fieldKey_order_idx" ON "OnboardingDropdownOption"("fieldKey", "order");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingDropdownOption_fieldKey_value_key" ON "OnboardingDropdownOption"("fieldKey", "value");

-- CreateIndex
CREATE INDEX "OnboardingOrientationAgenda_order_idx" ON "OnboardingOrientationAgenda"("order");

-- CreateIndex
CREATE INDEX "Page_status_idx" ON "Page"("status");
