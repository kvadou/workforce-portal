import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * GET /api/internal/tutors
 * Get tutor profiles for Acme integration
 * Query params:
 *   - tcId: TutorCruncher ID
 *   - email: User email
 *   - status: Tutor status filter
 */
export async function GET(req: NextRequest) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const tcId = searchParams.get("tcId");
    const email = searchParams.get("email");
    const status = searchParams.get("status");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (tcId) {
      where.tutorCruncherId = parseInt(tcId);
    }

    if (email) {
      where.user = { email: email.toLowerCase() };
    }

    if (status) {
      where.status = status;
    }

    const tutors = await prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            headshotUrl: true,
            role: true,
          },
        },
        certifications: {
          where: { status: "COMPLETED" },
          select: {
            type: true,
            earnedAt: true,
            expiresAt: true,
          },
        },
        labels: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Transform to Acme-compatible format
    const response = tutors.map((t) => ({
      id: t.id,
      tutorCruncherId: t.tutorCruncherId,
      userId: t.userId,
      email: t.user.email,
      name: t.user.name,
      phone: t.user.phone,
      avatarUrl: t.user.headshotUrl || t.user.avatarUrl,
      status: t.status,
      team: t.team,
      hireDate: t.hireDate,
      activatedAt: t.activatedAt,
      baseHourlyRate: t.baseHourlyRate ? Number(t.baseHourlyRate) : null,
      chessLevel: t.chessLevel,
      chessRating: t.chessRating,
      isSchoolCertified: t.isSchoolCertified,
      isBqCertified: t.isBqCertified,
      isPlaygroupCertified: t.isPlaygroupCertified,
      totalLessons: t.totalLessons,
      totalHours: Number(t.totalHours),
      averageRating: t.averageRating ? Number(t.averageRating) : null,
      lastLessonDate: t.lastLessonDate,
      certifications: t.certifications,
      labels: t.labels,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
