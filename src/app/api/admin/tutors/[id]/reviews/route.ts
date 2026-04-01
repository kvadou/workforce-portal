import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorCruncherContractorReviews } from "@/lib/integrations/tutorcruncher";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/reviews
 * Fetch TutorCruncher reviews for a tutor.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      select: { tutorCruncherId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    if (!tutorProfile.tutorCruncherId) {
      return NextResponse.json({ reviews: [], message: "No TutorCruncher ID" });
    }

    const result = await getTutorCruncherContractorReviews(tutorProfile.tutorCruncherId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch reviews" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reviews: result.data?.results || [] });
  } catch (error) {
    console.error("Error fetching tutor reviews:", error);
    return NextResponse.json({ error: "Failed to fetch tutor reviews" }, { status: 500 });
  }
}
