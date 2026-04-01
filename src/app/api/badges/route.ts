import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserBadges } from "@/lib/badge-engine";

/**
 * GET /api/badges
 * Get all badges earned by the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await getUserBadges(session.user.id);

    return NextResponse.json({
      badges: badges.map((ub) => ({
        id: ub.id,
        earnedAt: ub.earnedAt,
        metadata: ub.metadata,
        badge: {
          id: ub.badge.id,
          badgeKey: ub.badge.badgeKey,
          title: ub.badge.title,
          description: ub.badge.description,
          icon: ub.badge.icon,
          colorScheme: ub.badge.colorScheme,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
