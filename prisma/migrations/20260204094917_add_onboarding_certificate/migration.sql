-- CreateTable
CREATE TABLE "onboarding_certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "tutorName" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "onboarding_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_certificates_progressId_key" ON "onboarding_certificates"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_certificates_certificateNumber_key" ON "onboarding_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "onboarding_certificates_certificateNumber_idx" ON "onboarding_certificates"("certificateNumber");

-- AddForeignKey
ALTER TABLE "onboarding_certificates" ADD CONSTRAINT "onboarding_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_certificates" ADD CONSTRAINT "onboarding_certificates_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "OnboardingProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
