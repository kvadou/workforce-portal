import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/internal/tutors/[id]/stats
 * Update performance stats from STC
 *
 * Request body:
 *   - totalLessons: number
 *   - totalHours: number
 *   - averageRating: number
 *   - lastLessonDate: ISO date string
 *   - increment: boolean (if true, add to existing values instead of replacing)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const searchParams = req.nextUrl.searchParams;
    const idType = searchParams.get("idType") || "id"; // id or tcId

    const {
      totalLessons,
      totalHours,
      averageRating,
      lastLessonDate,
      increment = false,
    } = body;

    // Find the tutor profile
    let tutor;
    if (idType === "tcId") {
      tutor = await prisma.tutorProfile.findUnique({
        where: { tutorCruncherId: parseInt(id) },
      });
    } else {
      tutor = await prisma.tutorProfile.findUnique({
        where: { id },
      });
    }

    if (!tutor) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (totalLessons !== undefined) {
      updateData.totalLessons = increment
        ? { increment: totalLessons }
        : totalLessons;
    }

    if (totalHours !== undefined) {
      if (increment) {
        updateData.totalHours = Number(tutor.totalHours) + totalHours;
      } else {
        updateData.totalHours = totalHours;
      }
    }

    if (averageRating !== undefined) {
      updateData.averageRating = averageRating;
    }

    if (lastLessonDate !== undefined) {
      updateData.lastLessonDate = new Date(lastLessonDate);
    }

    // Update the tutor profile
    const updated = await prisma.tutorProfile.update({
      where: { id: tutor.id },
      data: updateData,
      select: {
        id: true,
        tutorCruncherId: true,
        totalLessons: true,
        totalHours: true,
        averageRating: true,
        lastLessonDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      updated: {
        id: updated.id,
        tutorCruncherId: updated.tutorCruncherId,
        totalLessons: updated.totalLessons,
        totalHours: Number(updated.totalHours),
        averageRating: updated.averageRating
          ? Number(updated.averageRating)
          : null,
        lastLessonDate: updated.lastLessonDate,
      },
    });
  } catch (error) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/internal/tutors/[id]/stats
 * Bulk update stats (alias for POST for RESTful compatibility)
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return POST(req, context);
}
