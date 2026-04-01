import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/internal/tutors/[id]/bio
 * Called by OpsHub to sync a tutor's bio.
 * The [id] is the TutorCruncher contractor ID.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const { bio } = await req.json();

    const tutorCruncherId = parseInt(id);
    if (isNaN(tutorCruncherId)) {
      return NextResponse.json(
        { error: "Invalid tutor ID" },
        { status: 400 }
      );
    }

    // Find tutor profile by TC ID
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { tutorCruncherId },
      select: { userId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Update the user's bio
    await prisma.user.update({
      where: { id: tutorProfile.userId },
      data: { bio: bio || null },
    });

    return NextResponse.json({ success: true, tutorCruncherId });
  } catch (error) {
    console.error("Internal bio sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
