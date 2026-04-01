import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/tutors/[id]/badges
 * Get all earned badges for a tutor
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
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
      select: { userId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    const badges = await prisma.userBadge.findMany({
      where: { userId: tutorProfile.userId },
      include: {
        badge: {
          select: {
            id: true,
            badgeKey: true,
            title: true,
            description: true,
            icon: true,
            colorScheme: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
    });

    return NextResponse.json({
      badges: badges.map((ub) => ({
        id: ub.badge.id,
        badgeKey: ub.badge.badgeKey,
        title: ub.badge.title,
        description: ub.badge.description,
        icon: ub.badge.icon,
        colorScheme: ub.badge.colorScheme,
        earnedAt: ub.earnedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tutor badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
