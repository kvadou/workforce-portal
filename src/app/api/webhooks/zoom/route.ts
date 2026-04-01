import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, handleWebhookValidation } from "@/lib/zoom";
import { awardPoints, POINTS_TRIGGERS } from "@/lib/points-engine";

/**
 * POST /api/webhooks/zoom
 * Handle Zoom webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const body = JSON.parse(payload);

    // Handle URL validation challenge (CRC)
    if (body.event === "endpoint.url_validation") {
      const { plainToken } = body.payload;
      const response = handleWebhookValidation(plainToken);
      return NextResponse.json(response);
    }

    // Verify webhook signature
    const signature = req.headers.get("x-zm-signature") || "";
    const timestamp = req.headers.get("x-zm-request-timestamp") || "";

    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      console.error("Invalid Zoom webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event, payload: eventPayload } = body;

    switch (event) {
      case "meeting.started":
        await handleMeetingStarted(eventPayload);
        break;

      case "meeting.ended":
        await handleMeetingEnded(eventPayload);
        break;

      case "meeting.participant_joined":
        await handleParticipantJoined(eventPayload);
        break;

      case "meeting.participant_left":
        await handleParticipantLeft(eventPayload);
        break;

      default:
        console.log(`Unhandled Zoom event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Zoom webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle meeting.started event
 */
async function handleMeetingStarted(payload: {
  object: { id: string; uuid: string; start_time: string };
}) {
  const { id: meetingId } = payload.object;

  // Find and update session
  const session = await prisma.liveSession.findFirst({
    where: { zoomMeetingId: String(meetingId) },
  });

  if (session) {
    await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        // Could add a "status" field to track meeting state
        updatedAt: new Date(),
      },
    });
    console.log(`Meeting started for session: ${session.title}`);
  }
}

/**
 * Handle meeting.ended event
 */
async function handleMeetingEnded(payload: {
  object: { id: string; uuid: string; end_time: string };
}) {
  const { id: meetingId } = payload.object;

  // Find session
  const session = await prisma.liveSession.findFirst({
    where: { zoomMeetingId: String(meetingId) },
  });

  if (!session) {
    return;
  }

  // Update all attendance records without leave time
  await prisma.liveSessionAttendance.updateMany({
    where: {
      sessionId: session.id,
      leftAt: null,
    },
    data: {
      leftAt: new Date(),
    },
  });

  // Calculate duration for all attendees
  const attendances = await prisma.liveSessionAttendance.findMany({
    where: { sessionId: session.id },
  });

  for (const attendance of attendances) {
    if (attendance.joinedAt && attendance.leftAt) {
      const durationMinutes = Math.round(
        (attendance.leftAt.getTime() - attendance.joinedAt.getTime()) / 60000
      );

      await prisma.liveSessionAttendance.update({
        where: { id: attendance.id },
        data: { durationMinutes },
      });

      // Award points for attending (minimum 10 minutes)
      if (durationMinutes >= 10) {
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { userId: attendance.userId },
        });

        if (tutorProfile) {
          await awardPoints(
            tutorProfile.id,
            POINTS_TRIGGERS.LIVE_SESSION_ATTENDED,
            { reason: `Attended live session: ${session.title}` }
          );
        }
      }
    }
  }

  console.log(`Meeting ended for session: ${session.title}`);
}

/**
 * Handle meeting.participant_joined event
 */
async function handleParticipantJoined(payload: {
  object: {
    id: string;
    uuid: string;
    participant: {
      user_id: string;
      user_name: string;
      email?: string;
      join_time: string;
    };
  };
}) {
  const { id: meetingId, participant } = payload.object;

  // Find session
  const session = await prisma.liveSession.findFirst({
    where: { zoomMeetingId: String(meetingId) },
  });

  if (!session) {
    return;
  }

  // Try to match participant to user by email
  let userId: string | null = null;
  if (participant.email) {
    const user = await prisma.user.findUnique({
      where: { email: participant.email.toLowerCase() },
    });
    userId = user?.id || null;
  }

  // If no user found by email, try to find by registration
  if (!userId) {
    // Get registrations for this session
    const registrations = await prisma.liveSessionRegistration.findMany({
      where: { sessionId: session.id },
    });

    // Fetch users for these registrations
    const userIds = registrations.map(r => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    // If name matches a registered user, use that
    for (const user of users) {
      if (
        user.name?.toLowerCase() === participant.user_name?.toLowerCase()
      ) {
        userId = user.id;
        break;
      }
    }
  }

  if (!userId) {
    console.log(`Could not match Zoom participant: ${participant.user_name}`);
    return;
  }

  // Check if attendance record exists
  const existingAttendance = await prisma.liveSessionAttendance.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (!existingAttendance) {
    await prisma.liveSessionAttendance.create({
      data: {
        sessionId: session.id,
        userId,
        joinedAt: new Date(participant.join_time),
      },
    });
    console.log(`Participant joined: ${participant.user_name}`);
  }
}

/**
 * Handle meeting.participant_left event
 */
async function handleParticipantLeft(payload: {
  object: {
    id: string;
    uuid: string;
    participant: {
      user_id: string;
      user_name: string;
      email?: string;
      leave_time: string;
    };
  };
}) {
  const { id: meetingId, participant } = payload.object;

  // Find session
  const session = await prisma.liveSession.findFirst({
    where: { zoomMeetingId: String(meetingId) },
  });

  if (!session) {
    return;
  }

  // Try to match participant to user
  let userId: string | null = null;
  if (participant.email) {
    const user = await prisma.user.findUnique({
      where: { email: participant.email.toLowerCase() },
    });
    userId = user?.id || null;
  }

  if (!userId) {
    return;
  }

  // Update attendance record
  const attendance = await prisma.liveSessionAttendance.findUnique({
    where: {
      sessionId_userId: {
        sessionId: session.id,
        userId,
      },
    },
  });

  if (attendance && !attendance.leftAt) {
    const leftAt = new Date(participant.leave_time);
    const durationMinutes = Math.round(
      (leftAt.getTime() - attendance.joinedAt.getTime()) / 60000
    );

    await prisma.liveSessionAttendance.update({
      where: { id: attendance.id },
      data: {
        leftAt,
        durationMinutes,
      },
    });
    console.log(`Participant left: ${participant.user_name} (${durationMinutes} min)`);
  }
}
