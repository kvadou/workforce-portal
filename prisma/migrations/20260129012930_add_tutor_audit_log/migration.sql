-- CreateTable
CREATE TABLE "tutor_audit_logs" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_audit_logs_tutorProfileId_idx" ON "tutor_audit_logs"("tutorProfileId");

-- CreateIndex
CREATE INDEX "tutor_audit_logs_action_idx" ON "tutor_audit_logs"("action");

-- CreateIndex
CREATE INDEX "tutor_audit_logs_createdAt_idx" ON "tutor_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "tutor_audit_logs" ADD CONSTRAINT "tutor_audit_logs_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
