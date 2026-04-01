import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorCruncherContractorAppointments } from "@/lib/integrations/tutorcruncher";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/appointments
 * Fetch TutorCruncher appointments for a tutor.
 * Accepts ?limit=N&offset=N query params.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      select: { tutorCruncherId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    if (!tutorProfile.tutorCruncherId) {
      return NextResponse.json({
        appointments: [],
        total: 0,
        hasMore: false,
        message: "No TutorCruncher ID",
      });
    }

    const result = await getTutorCruncherContractorAppointments(
      tutorProfile.tutorCruncherId,
      limit,
      offset
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch appointments" },
        { status: 502 }
      );
    }

    const data = result.data;
    // TC API returns {results, count, next} or just an array
    const appointments = Array.isArray(data) ? data : data?.results || [];
    const total = Array.isArray(data) ? appointments.length : data?.count || appointments.length;
    const hasMore = Array.isArray(data) ? false : !!data?.next;

    return NextResponse.json({ appointments, total, hasMore });
  } catch (error) {
    console.error("Error fetching tutor appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor appointments" },
      { status: 500 }
    );
  }
}
