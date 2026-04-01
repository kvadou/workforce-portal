import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecommendationsForUser, getTrendingCourses } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

// GET /api/recommendations - Get personalized course recommendations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get personalized recommendations
    const personalized = await getRecommendationsForUser(session.user.id, 6);

    // Get trending courses as backup/supplement
    const trending = await getTrendingCourses(3);

    // Combine and deduplicate
    const personalizedIds = new Set(personalized.map((c) => c.id));
    const additionalTrending = trending.filter((c) => !personalizedIds.has(c.id));

    return NextResponse.json({
      personalized,
      trending: additionalTrending,
    });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
