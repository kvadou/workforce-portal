import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/internal/tutors/[id]
 * Get a tutor profile by ID (can be STT id or TutorCruncher id)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const idType = searchParams.get("idType") || "id"; // id, tcId, or email

    let tutor;

    if (idType === "tcId") {
      tutor = await prisma.tutorProfile.findUnique({
        where: { tutorCruncherId: parseInt(id) },
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
              organization: {
                select: {
                  id: true,
                  name: true,
                  subdomain: true,
                },
              },
            },
          },
          certifications: true,
          labels: true,
        },
      });
    } else if (idType === "email") {
      tutor = await prisma.tutorProfile.findFirst({
        where: { user: { email: id.toLowerCase() } },
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
              organization: {
                select: {
                  id: true,
                  name: true,
                  subdomain: true,
                },
              },
            },
          },
          certifications: true,
          labels: true,
        },
      });
    } else {
      tutor = await prisma.tutorProfile.findUnique({
        where: { id },
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
              organization: {
                select: {
                  id: true,
                  name: true,
                  subdomain: true,
                },
              },
            },
          },
          certifications: true,
          labels: true,
        },
      });
    }

    if (!tutor) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Transform to Acme-compatible format
    const response = {
      id: tutor.id,
      tutorCruncherId: tutor.tutorCruncherId,
      branchId: tutor.branchId,
      userId: tutor.userId,
      email: tutor.user.email,
      name: tutor.user.name,
      phone: tutor.user.phone,
      avatarUrl: tutor.user.headshotUrl || tutor.user.avatarUrl,
      status: tutor.status,
      team: tutor.team,
      organization: tutor.user.organization,
      hireDate: tutor.hireDate,
      activatedAt: tutor.activatedAt,
      terminatedAt: tutor.terminatedAt,
      baseHourlyRate: tutor.baseHourlyRate ? Number(tutor.baseHourlyRate) : null,
      chessLevel: tutor.chessLevel,
      chessRating: tutor.chessRating,
      noctieRating: tutor.noctieRating,
      chessableUsername: tutor.chessableUsername,
      chessableProgress: tutor.chessableProgress,
      isSchoolCertified: tutor.isSchoolCertified,
      isBqCertified: tutor.isBqCertified,
      isPlaygroupCertified: tutor.isPlaygroupCertified,
      totalLessons: tutor.totalLessons,
      totalHours: Number(tutor.totalHours),
      averageRating: tutor.averageRating ? Number(tutor.averageRating) : null,
      lastLessonDate: tutor.lastLessonDate,
      certifications: tutor.certifications.map((c) => ({
        type: c.type,
        status: c.status,
        earnedAt: c.earnedAt,
        expiresAt: c.expiresAt,
      })),
      labels: tutor.labels.map((l) => ({
        name: l.name,
        color: l.color,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
