import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/onboarding/phases — Recalculate and update phase completion timestamps
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
      include: { videoPartProgress: true },
    });

    if (!progress) {
      return NextResponse.json({ error: "No onboarding progress found" }, { status: 404 });
    }

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    // Phase 1: Welcome video + all 6 videos watched + all 6 quizzes passed
    const allVideosComplete =
      progress.videoPartProgress.length === 6 &&
      progress.videoPartProgress.every((v) => v.videoCompletedAt && v.quizPassedAt);
    if (allVideosComplete && progress.welcomeCompletedAt && !progress.phase1CompletedAt) {
      updates.phase1CompletedAt = now;
    }

    // Phase 2: Profile + W-9 complete
    if (progress.profileCompletedAt && progress.w9CompletedAt && !progress.phase2CompletedAt) {
      updates.phase2CompletedAt = now;
    }

    // Phase 3: Orientation attended
    if (progress.orientationAttendedAt && !progress.phase3CompletedAt) {
      updates.phase3CompletedAt = now;
    }

    // Phase 4: All training sessions complete
    if (
      progress.demoMagicComplete &&
      progress.chessConfidenceComplete &&
      progress.teachingInSchoolsComplete &&
      progress.chessableComplete &&
      !progress.phase4CompletedAt
    ) {
      updates.phase4CompletedAt = now;
    }

    // Phase 5: All shadows complete
    if (
      progress.shadow1Complete &&
      progress.shadow2Complete &&
      progress.shadow3Complete &&
      !progress.phase5CompletedAt
    ) {
      updates.phase5CompletedAt = now;
    }

    // Phase 6: Activated
    if (progress.activatedAt && !progress.phase6CompletedAt) {
      updates.phase6CompletedAt = now;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.onboardingProgress.update({
        where: { id: progress.id },
        data: updates,
      });
    }

    return NextResponse.json({
      updated: Object.keys(updates),
      phases: {
        phase1: !!progress.phase1CompletedAt || !!updates.phase1CompletedAt,
        phase2: !!progress.phase2CompletedAt || !!updates.phase2CompletedAt,
        phase3: !!progress.phase3CompletedAt || !!updates.phase3CompletedAt,
        phase4: !!progress.phase4CompletedAt || !!updates.phase4CompletedAt,
        phase5: !!progress.phase5CompletedAt || !!updates.phase5CompletedAt,
        phase6: !!progress.phase6CompletedAt || !!updates.phase6CompletedAt,
      },
    });
  } catch (error) {
    console.error("Phase update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
