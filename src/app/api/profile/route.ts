import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        headshotUrl: true,
        phone: true,
        bio: true,
        dateOfBirth: true,
        hireDate: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        languages: true,
        teachingStylePreferences: true,
        availabilityNotes: true,
        yearsExperience: true,
        previousExperience: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Only allow updating specific fields (not role, email, etc.)
    const allowedFields = [
      "name",
      "avatarUrl",
      "headshotUrl",
      "phone",
      "bio",
      "dateOfBirth",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
      "languages",
      "teachingStylePreferences",
      "availabilityNotes",
      "yearsExperience",
      "previousExperience",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle special cases
        if (field === "dateOfBirth" && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (field === "yearsExperience" && body[field] !== null) {
          updateData[field] = parseInt(body[field], 10) || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        headshotUrl: true,
        phone: true,
        bio: true,
        dateOfBirth: true,
        hireDate: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        languages: true,
        teachingStylePreferences: true,
        availabilityNotes: true,
        yearsExperience: true,
        previousExperience: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    // Sync profile to OpsHub (fire-and-forget — don't block the user's save)
    syncProfileToOpsHub(session.user.id, user).catch((err) =>
      console.error("Profile sync to OpsHub failed:", err.message)
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/**
 * Async sync of tutor profile data to OpsHub.
 * Looks up the tutor's TutorCruncher ID, then POSTs profile fields to OpsHub.
 */
async function syncProfileToOpsHub(
  userId: string,
  user: { bio?: string | null; headshotUrl?: string | null; avatarUrl?: string | null; teachingStylePreferences?: string | null; yearsExperience?: number | null; name?: string | null }
) {
  const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!opsHubUrl || !secret) return; // Not configured — skip silently

  // Look up TutorCruncher ID from TutorProfile
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { tutorCruncherId: true },
  });

  if (!tutorProfile?.tutorCruncherId) return; // No TC link — can't sync

  await fetch(`${opsHubUrl}/api/internal/tutor-profile-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      tutorCruncherId: tutorProfile.tutorCruncherId,
      bio: user.bio ?? undefined,
      headshotUrl: user.headshotUrl ?? user.avatarUrl ?? undefined,
      teachingStyle: user.teachingStylePreferences ?? undefined,
      yearsExperience: user.yearsExperience ?? undefined,
    }),
  });
}
