import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMeeting, isZoomConfigured } from "@/lib/zoom";
import { LiveSessionCategory } from "@prisma/client";

/**
 * GET /api/live-sessions
 * List upcoming live sessions
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as LiveSessionCategory | null;
    const includesPast = searchParams.get("past") === "true";

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (!includesPast) {
      where.scheduledAt = { gte: new Date() };
    }

    if (category) {
      where.category = category;
    }

    const sessions = await prisma.liveSession.findMany({
      where,
      include: {
        registrations: {
          where: { userId: session.user.id },
          take: 1,
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      hostId: s.hostId,
      hostName: s.hostName,
      scheduledAt: s.scheduledAt.toISOString(),
      duration: s.duration,
      maxParticipants: s.maxParticipants,
      category: s.category,
      isRegistered: s.registrations.length > 0,
      participantCount: s._count.registrations,
      spotsRemaining: s.maxParticipants - s._count.registrations,
      // Only show join URL if registered
      zoomJoinUrl: s.registrations.length > 0 ? s.zoomJoinUrl : null,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Error fetching live sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/live-sessions
 * Create a new live session (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      scheduledAt,
      duration = 60,
      maxParticipants = 100,
      category,
      hostName,
      createZoomMeeting = true,
    } = body;

    if (!title || !scheduledAt || !category) {
      return NextResponse.json(
        { error: "Title, scheduledAt, and category are required" },
        { status: 400 }
      );
    }

    const startTime = new Date(scheduledAt);
    if (startTime < new Date()) {
      return NextResponse.json(
        { error: "Session must be scheduled in the future" },
        { status: 400 }
      );
    }

    let zoomMeetingId: string | null = null;
    let zoomJoinUrl: string | null = null;
    let zoomStartUrl: string | null = null;

    // Create Zoom meeting if configured and requested
    if (createZoomMeeting && isZoomConfigured()) {
      try {
        const meeting = await createMeeting({
          topic: title,
          startTime,
          duration,
          agenda: description || undefined,
        });

        zoomMeetingId = String(meeting.id);
        zoomJoinUrl = meeting.join_url;
        zoomStartUrl = meeting.start_url;
      } catch (error) {
        console.error("Failed to create Zoom meeting:", error);
        // Continue without Zoom - admin can add manually later
      }
    }

    const liveSession = await prisma.liveSession.create({
      data: {
        title,
        description,
        hostId: session.user.id,
        hostName: hostName || user.name || "TBD",
        scheduledAt: startTime,
        duration,
        maxParticipants,
        category,
        zoomMeetingId,
        zoomJoinUrl,
        zoomStartUrl,
      },
    });

    return NextResponse.json(liveSession, { status: 201 });
  } catch (error) {
    console.error("Error creating live session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
