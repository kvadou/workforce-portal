import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  onWelcomeComplete,
  updateOnboardingGoalProgress,
  calculateCompletedSteps,
} from "@/lib/onboarding-gamification";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { progressId } = body;

    // Verify this progress belongs to the current user
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid progress record" }, { status: 403 });
    }

    // Update progress - mark welcome as completed and advance status to VIDEOS_IN_PROGRESS
    const updatedProgress = await prisma.onboardingProgress.update({
      where: { id: progressId },
      data: {
        welcomeCompletedAt: new Date(),
        status: "VIDEOS_IN_PROGRESS",
      },
    });

    // Award points and badges for completing welcome step
    await onWelcomeComplete(session.user.id, progressId);

    // Update onboarding goal progress
    const stepsCompleted = calculateCompletedSteps(updatedProgress);
    await updateOnboardingGoalProgress(session.user.id, stepsCompleted);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking welcome complete:", error);
    return NextResponse.json(
      { error: "Failed to mark welcome complete" },
      { status: 500 }
    );
  }
}
