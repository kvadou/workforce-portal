import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// Whitelist of allowed notes/text fields
const NOTES_FIELDS = new Set([
  "shadowFeedback",
  "longTermGoals",
  "location",
  "firstImpressions",
  "availabilityScheduling",
  "chessLevelNotes",
  "month1MentorNotes",
  "initialCallNotes",
  "adminNotes",
]);

/**
 * PUT /api/admin/onboarding/[id]/notes
 * Save one or more notes/text fields (partial update)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Filter to only allowed fields
    const updateData: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(body)) {
      if (NOTES_FIELDS.has(key)) {
        updateData[key] = typeof value === "string" ? value : null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid notes fields provided" },
        { status: 400 }
      );
    }

    // Verify the onboarding progress exists
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id },
    });
    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.onboardingProgress.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Notes update error:", error);
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 }
    );
  }
}
