import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onOrientationRegistered } from "@/lib/onboarding-gamification";

// Register for an orientation session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, progressId } = body;

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Check if already registered
    if (progress.orientationSessionId) {
      return NextResponse.json(
        { error: "Already registered for a session" },
        { status: 400 }
      );
    }

    // Get the session and check availability
    const orientationSession = await prisma.orientationSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!orientationSession || !orientationSession.isActive) {
      return NextResponse.json(
        { error: "Session not found or not available" },
        { status: 404 }
      );
    }

    // Check if session is full
    if (orientationSession._count.participants >= orientationSession.maxParticipants) {
      return NextResponse.json(
        { error: "Session is full" },
        { status: 400 }
      );
    }

    // Check if session is in the future
    if (new Date(orientationSession.scheduledAt) <= new Date()) {
      return NextResponse.json(
        { error: "Cannot register for past sessions" },
        { status: 400 }
      );
    }

    // Register for the session
    await prisma.onboardingProgress.update({
      where: { id: progressId },
      data: {
        orientationSessionId: sessionId,
        status: "ORIENTATION_SCHEDULED",
      },
    });

    // Send confirmation notification
    await onOrientationRegistered(
      session.user.id,
      orientationSession.scheduledAt,
      orientationSession.title
    );

    return NextResponse.json({
      success: true,
      session: orientationSession,
    });
  } catch (error) {
    console.error("Error registering for orientation:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}

// Cancel orientation registration
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { progressId } = body;

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Check if registered
    if (!progress.orientationSessionId) {
      return NextResponse.json(
        { error: "Not registered for any session" },
        { status: 400 }
      );
    }

    // Cancel registration
    await prisma.onboardingProgress.update({
      where: { id: progressId },
      data: {
        orientationSessionId: null,
        status: "AWAITING_ORIENTATION",
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error cancelling orientation:", error);
    return NextResponse.json(
      { error: "Failed to cancel" },
      { status: 500 }
    );
  }
}
