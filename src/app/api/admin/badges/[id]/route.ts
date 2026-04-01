import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { awardBadge } from "@/lib/badge-engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/badges/[id]
 * Get badge details with list of users who earned it
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

    const badge = await prisma.onboardingBadge.findUnique({
      where: { id },
      include: {
        earnedBy: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { earnedAt: "desc" },
        },
      },
    });

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json(badge);
  } catch (error) {
    console.error("Error fetching badge:", error);
    return NextResponse.json(
      { error: "Failed to fetch badge" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/badges/[id]
 * Manually award badge to a user
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get badge key
    const badge = await prisma.onboardingBadge.findUnique({
      where: { id },
    });

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    const awarded = await awardBadge(userId, badge.badgeKey, {
      manuallyAwarded: true,
      awardedBy: session.user.id,
      awardedByName: session.user.name,
    });

    if (!awarded) {
      return NextResponse.json(
        { error: "User already has this badge or badge is inactive" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/badges/[id]
 * Revoke badge from a user
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Delete the user badge
    await prisma.userBadge.deleteMany({
      where: {
        badgeId: id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking badge:", error);
    return NextResponse.json(
      { error: "Failed to revoke badge" },
      { status: 500 }
    );
  }
}
