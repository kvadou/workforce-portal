import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMeeting, deleteMeeting, isZoomConfigured } from "@/lib/zoom";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/live-sessions/[id]
 * Get session details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        registrations: {
          where: { userId: session.user.id },
          take: 1,
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isRegistered = liveSession.registrations.length > 0;

    return NextResponse.json({
      id: liveSession.id,
      title: liveSession.title,
      description: liveSession.description,
      hostId: liveSession.hostId,
      hostName: liveSession.hostName,
      scheduledAt: liveSession.scheduledAt.toISOString(),
      duration: liveSession.duration,
      maxParticipants: liveSession.maxParticipants,
      category: liveSession.category,
      isActive: liveSession.isActive,
      isRegistered,
      participantCount: liveSession._count.registrations,
      spotsRemaining: liveSession.maxParticipants - liveSession._count.registrations,
      // Only show join URL if registered
      zoomJoinUrl: isRegistered ? liveSession.zoomJoinUrl : null,
      // Only show start URL if user is host
      zoomStartUrl: liveSession.hostId === session.user.id ? liveSession.zoomStartUrl : null,
    });
  } catch (error) {
    console.error("Error fetching live session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/live-sessions/[id]
 * Update session (admin/host only)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing session
    const existingSession = await prisma.liveSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is admin or host
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user && ["SUPER_ADMIN", "ADMIN"].includes(user.role);
    const isHost = existingSession.hostId === session.user.id;

    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      scheduledAt,
      duration,
      maxParticipants,
      category,
      hostName,
      isActive,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (duration !== undefined) updateData.duration = duration;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (category !== undefined) updateData.category = category;
    if (hostName !== undefined) updateData.hostName = hostName;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate scheduled time if being updated
    if (updateData.scheduledAt && (updateData.scheduledAt as Date) < new Date()) {
      return NextResponse.json(
        { error: "Session must be scheduled in the future" },
        { status: 400 }
      );
    }

    // Update Zoom meeting if configured and relevant fields changed
    if (
      existingSession.zoomMeetingId &&
      isZoomConfigured() &&
      (title !== undefined || scheduledAt !== undefined || duration !== undefined || description !== undefined)
    ) {
      try {
        await updateMeeting(existingSession.zoomMeetingId, {
          topic: title,
          startTime: scheduledAt ? new Date(scheduledAt) : undefined,
          duration,
          agenda: description,
        });
      } catch (error) {
        console.error("Failed to update Zoom meeting:", error);
        // Continue with local update even if Zoom fails
      }
    }

    const updatedSession = await prisma.liveSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating live session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live-sessions/[id]
 * Delete session (admin only)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get session to check for Zoom meeting
    const existingSession = await prisma.liveSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Delete Zoom meeting if exists
    if (existingSession.zoomMeetingId && isZoomConfigured()) {
      try {
        await deleteMeeting(existingSession.zoomMeetingId);
      } catch (error) {
        console.error("Failed to delete Zoom meeting:", error);
        // Continue with local delete even if Zoom fails
      }
    }

    await prisma.liveSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
