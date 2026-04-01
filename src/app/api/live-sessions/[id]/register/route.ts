import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/live-sessions/[id]/register
 * Register for a live session
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get session with registration count
    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!liveSession.isActive) {
      return NextResponse.json(
        { error: "This session is no longer active" },
        { status: 400 }
      );
    }

    // Check if session is in the past
    if (liveSession.scheduledAt < new Date()) {
      return NextResponse.json(
        { error: "Cannot register for past sessions" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.liveSessionRegistration.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this session" },
        { status: 400 }
      );
    }

    // Check capacity
    if (liveSession._count.registrations >= liveSession.maxParticipants) {
      return NextResponse.json(
        { error: "Session is full" },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await prisma.liveSessionRegistration.create({
      data: {
        sessionId: id,
        userId: session.user.id,
      },
    });

    // Return updated session info with join URL
    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      zoomJoinUrl: liveSession.zoomJoinUrl,
      message: "Successfully registered for session",
    });
  } catch (error) {
    console.error("Error registering for session:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live-sessions/[id]/register
 * Unregister from a live session
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get session
    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is in the past or too close to start (within 1 hour)
    const oneHourBeforeStart = new Date(liveSession.scheduledAt.getTime() - 60 * 60 * 1000);
    if (new Date() > oneHourBeforeStart) {
      return NextResponse.json(
        { error: "Cannot unregister within 1 hour of session start" },
        { status: 400 }
      );
    }

    // Check if registered
    const existingRegistration = await prisma.liveSessionRegistration.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.user.id,
        },
      },
    });

    if (!existingRegistration) {
      return NextResponse.json(
        { error: "Not registered for this session" },
        { status: 400 }
      );
    }

    // Delete registration
    await prisma.liveSessionRegistration.delete({
      where: { id: existingRegistration.id },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully unregistered from session",
    });
  } catch (error) {
    console.error("Error unregistering from session:", error);
    return NextResponse.json(
      { error: "Failed to unregister" },
      { status: 500 }
    );
  }
}
