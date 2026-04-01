import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Fields that map to the User model
const USER_FIELDS = [
  "bio",
  "headshotUrl",
  "phone",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
  "languages",
] as const;

// Fields that map to the TutorProfile model
const TUTOR_PROFILE_FIELDS = ["pronouns"] as const;

/**
 * PUT /api/internal/tutors/[id]/profile-sync
 * Called by OpsHub to sync any combination of profile fields.
 * The [id] is the TutorCruncher contractor ID.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();

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
      select: { id: true, userId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Build User update data (only include fields present in the request)
    const userData: Record<string, unknown> = {};
    for (const field of USER_FIELDS) {
      if (body[field] !== undefined) {
        userData[field] = body[field];
      }
    }

    // Build TutorProfile update data
    const profileData: Record<string, unknown> = {};
    for (const field of TUTOR_PROFILE_FIELDS) {
      if (body[field] !== undefined) {
        profileData[field] = body[field];
      }
    }

    // Execute updates (only if there's data to update)
    const updates: Promise<unknown>[] = [];

    if (Object.keys(userData).length > 0) {
      updates.push(
        prisma.user.update({
          where: { id: tutorProfile.userId },
          data: userData,
        })
      );
    }

    if (Object.keys(profileData).length > 0) {
      updates.push(
        prisma.tutorProfile.update({
          where: { id: tutorProfile.id },
          data: profileData,
        })
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true, tutorCruncherId });
  } catch (error) {
    console.error("Internal profile-sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
