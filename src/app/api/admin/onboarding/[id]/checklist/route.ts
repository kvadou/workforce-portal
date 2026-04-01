import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// Whitelist of allowed boolean checklist fields and their timestamp counterparts
const CHECKLIST_FIELDS: Record<string, string | null> = {
  // Emails
  certDateEmailSent: "certDateEmailSentAt",
  nextStepsShadowEmailSent: "nextStepsShadowEmailSentAt",
  onlineCertEmailSent: "onlineCertEmailSentAt",
  welcomeEmailSent: "welcomeEmailSentAt",
  // Milestones
  certificationComplete: "certificationCompletedAt",
  payoutsSetup: "payoutsSetupAt",
  orientationDebriefComplete: "orientationDebriefAt",
  demoMagicComplete: "demoMagicCompletedAt",
  chessConfidenceComplete: "chessConfidenceCompletedAt",
  teachingInSchoolsComplete: "teachingInSchoolsCompletedAt",
  chessableComplete: "chessableCompletedAt",
  // Calls & Observations
  initialCallComplete: "initialCallAt",
  shadow1Complete: "shadow1At",
  shadow2Complete: "shadow2At",
  shadow3Complete: "shadow3At",
  mentorSignUp: null, // No timestamp field
  // Activation tracking
  googleGroupAdded: "googleGroupAddedAt",
  tutorCruncherCreated: "tutorCruncherCreatedAt",
  welcomeEmailSent: "welcomeEmailSentAt",
  branchIdGenerated: "branchIdGeneratedAt",
};

/**
 * PUT /api/admin/onboarding/[id]/checklist
 * Toggle a boolean checklist field with auto-timestamp
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { field, value } = body;

    if (!field || typeof value !== "boolean") {
      return NextResponse.json(
        { error: "field (string) and value (boolean) are required" },
        { status: 400 }
      );
    }

    if (!(field in CHECKLIST_FIELDS)) {
      return NextResponse.json(
        { error: `Invalid checklist field: ${field}` },
        { status: 400 }
      );
    }

    // Verify the onboarding progress exists
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id },
    });
    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    // Build the update data
    const updateData: Record<string, unknown> = {
      [field]: value,
    };

    // Auto-set or clear the corresponding timestamp
    const timestampField = CHECKLIST_FIELDS[field];
    if (timestampField) {
      updateData[timestampField] = value ? new Date() : null;
    }

    const updated = await prisma.onboardingProgress.update({
      where: { id },
      data: updateData,
      include: { videoPartProgress: true },
    });

    // Auto-recalculate phase completion timestamps
    const now = new Date();
    const phaseUpdates: Record<string, Date | null> = {};

    // Phase 1: Welcome + all 6 videos + quizzes
    const allVideosComplete =
      updated.videoPartProgress.length === 6 &&
      updated.videoPartProgress.every((v) => v.videoCompletedAt && v.quizPassedAt);
    if (allVideosComplete && updated.welcomeCompletedAt && !updated.phase1CompletedAt) {
      phaseUpdates.phase1CompletedAt = now;
    }

    // Phase 2: Profile + W-9
    if (updated.profileCompletedAt && updated.w9CompletedAt && !updated.phase2CompletedAt) {
      phaseUpdates.phase2CompletedAt = now;
    }

    // Phase 3: Orientation attended
    if (updated.orientationAttendedAt && !updated.phase3CompletedAt) {
      phaseUpdates.phase3CompletedAt = now;
    }

    // Phase 4: All training
    if (
      updated.demoMagicComplete &&
      updated.chessConfidenceComplete &&
      updated.teachingInSchoolsComplete &&
      updated.chessableComplete &&
      !updated.phase4CompletedAt
    ) {
      phaseUpdates.phase4CompletedAt = now;
    }

    // Phase 5: All shadows
    if (
      updated.shadow1Complete &&
      updated.shadow2Complete &&
      updated.shadow3Complete &&
      !updated.phase5CompletedAt
    ) {
      phaseUpdates.phase5CompletedAt = now;
    }

    // Phase 6: Activated
    if (updated.activatedAt && !updated.phase6CompletedAt) {
      phaseUpdates.phase6CompletedAt = now;
    }

    if (Object.keys(phaseUpdates).length > 0) {
      await prisma.onboardingProgress.update({
        where: { id },
        data: phaseUpdates,
      });
    }

    return NextResponse.json({
      success: true,
      field,
      value,
      timestamp: timestampField ? updated[timestampField as keyof typeof updated] : null,
      phasesUpdated: Object.keys(phaseUpdates),
    });
  } catch (error) {
    console.error("Checklist toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
