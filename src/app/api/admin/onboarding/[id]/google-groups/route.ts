import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import {
  addToGoogleGroup,
  getAvailableGroups,
  resolveGroupEmail,
} from "@/lib/integrations/google-groups";

/**
 * GET /api/admin/onboarding/[id]/google-groups
 * Return available Google Groups
 */
export async function GET(
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

    const groups = getAvailableGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Google Groups list error:", error);
    return NextResponse.json(
      { error: "Failed to get groups" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/onboarding/[id]/google-groups
 * Add tutor to a Google Group
 */
export async function POST(
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
    const { groupKey } = body;

    if (!groupKey) {
      return NextResponse.json(
        { error: "groupKey is required" },
        { status: 400 }
      );
    }

    const groupEmail = resolveGroupEmail(groupKey);
    if (!groupEmail) {
      return NextResponse.json(
        { error: `Invalid group key: ${groupKey}` },
        { status: 400 }
      );
    }

    // Get the onboarding progress with user email
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    // Add to Google Group
    const result = await addToGoogleGroup(progress.user.email, groupEmail);

    if (result.success) {
      // Update onboarding progress
      await prisma.onboardingProgress.update({
        where: { id },
        data: {
          googleGroupAdded: true,
          googleGroupAddedAt: new Date(),
          googleGroupName: groupKey,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      alreadyExists: result.alreadyExists,
      groupKey,
      groupEmail,
    });
  } catch (error) {
    console.error("Google Groups add error:", error);
    return NextResponse.json(
      { error: "Failed to add to Google Group" },
      { status: 500 }
    );
  }
}
