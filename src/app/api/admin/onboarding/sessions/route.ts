import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// Create a new session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      scheduledAt,
      duration,
      zoomLink,
      hostName,
      maxParticipants,
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: "Title and scheduled date are required" },
        { status: 400 }
      );
    }

    const orientationSession = await prisma.orientationSession.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 90,
        zoomLink,
        hostName,
        hostId: session.user.id,
        maxParticipants: maxParticipants || 20,
      },
    });

    return NextResponse.json({ success: true, session: orientationSession });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// Update a session
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      title,
      description,
      scheduledAt,
      duration,
      zoomLink,
      hostName,
      maxParticipants,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const orientationSession = await prisma.orientationSession.update({
      where: { id },
      data: {
        title,
        description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration,
        zoomLink,
        hostName,
        maxParticipants,
      },
    });

    return NextResponse.json({ success: true, session: orientationSession });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// Delete (deactivate) a session
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Deactivate rather than delete to preserve history
    await prisma.orientationSession.update({
      where: { id },
      data: { isActive: false },
    });

    // Unregister all participants
    await prisma.onboardingProgress.updateMany({
      where: { orientationSessionId: id },
      data: {
        orientationSessionId: null,
        status: "AWAITING_ORIENTATION",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
