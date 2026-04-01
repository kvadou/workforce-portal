import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/onboarding/[id]
 * Fetch full onboarding progress detail for admin profile page
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

    const { id } = await params;

    const progress = await prisma.onboardingProgress.findUnique({
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
          },
        },
        orientationSession: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
          },
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    // Find cohort membership if any
    let cohortMembership = null;
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: progress.userId },
      select: { id: true },
    });

    if (tutorProfile) {
      const membership = await prisma.cohortMember.findFirst({
        where: { tutorProfileId: tutorProfile.id },
        include: {
          cohort: {
            select: { id: true, name: true },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      if (membership) {
        cohortMembership = {
          cohortId: membership.cohort.id,
          cohortName: membership.cohort.name,
        };
      }
    }

    return NextResponse.json({
      ...progress,
      cohortMembership,
    });
  } catch (error) {
    console.error("Onboarding detail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding detail" },
      { status: 500 }
    );
  }
}
