import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaderboard, getTutorRank, getTutorPoints } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

// GET /api/leaderboards - Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "monthly") as "all" | "monthly" | "weekly";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const team = searchParams.get("team") || undefined;

    // Get leaderboard
    const leaderboard = await getLeaderboard({ limit, period, team });

    // Get current user's data if they have a tutor profile
    let currentUser = null;
    const tutorProfile = await import("@/lib/prisma").then(m =>
      m.prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      })
    );

    if (tutorProfile) {
      const [rank, points] = await Promise.all([
        getTutorRank(tutorProfile.id, period),
        getTutorPoints(tutorProfile.id),
      ]);

      currentUser = {
        rank,
        tutorProfileId: tutorProfile.id,
        points: points?.totalPoints || 0,
        monthlyPoints: points?.monthlyPoints || 0,
        weeklyPoints: points?.weeklyPoints || 0,
        breakdown: points?.breakdown || null,
      };
    }

    // Cache leaderboard for 10 minutes (600 seconds)
    return NextResponse.json(
      {
        leaderboard,
        currentUser,
        period,
      },
      {
        headers: {
          "Cache-Control": "private, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
