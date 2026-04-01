import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorTeam } from "@prisma/client";

/**
 * GET /api/admin/tutors/teams
 * Get team statistics and performance metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get counts and aggregates by team
    const teamStats = await prisma.tutorProfile.groupBy({
      by: ["team"],
      _count: { id: true },
      _avg: { averageRating: true, totalLessons: true },
      _sum: { totalLessons: true, totalHours: true },
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
      },
    });

    // Get status breakdown per team
    const statusByTeam = await prisma.tutorProfile.groupBy({
      by: ["team", "status"],
      _count: { id: true },
    });

    // Get recent hires (last 30 days) per team
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentHires = await prisma.tutorProfile.groupBy({
      by: ["team"],
      _count: { id: true },
      where: {
        hireDate: { gte: thirtyDaysAgo },
      },
    });

    // Get certified tutors per team
    const certifiedByTeam = await prisma.tutorProfile.groupBy({
      by: ["team"],
      _count: { id: true },
      where: {
        status: "ACTIVE",
        OR: [
          { isSchoolCertified: true },
          { isBqCertified: true },
          { isPlaygroupCertified: true },
        ],
      },
    });

    // Build response
    const teams: TutorTeam[] = ["LA", "NYC", "SF", "ONLINE", "WESTSIDE", "EASTSIDE"];

    const teamData = teams.map((team) => {
      const stats = teamStats.find((s) => s.team === team);
      const statuses = statusByTeam.filter((s) => s.team === team);
      const hires = recentHires.find((h) => h.team === team);
      const certified = certifiedByTeam.find((c) => c.team === team);

      return {
        team,
        totalTutors: stats?._count.id || 0,
        activeTutors: statuses.find((s) => s.status === "ACTIVE")?._count.id || 0,
        pendingTutors: statuses.find((s) => s.status === "PENDING")?._count.id || 0,
        avgRating: stats?._avg.averageRating ? Number(stats._avg.averageRating).toFixed(2) : null,
        avgLessons: stats?._avg.totalLessons ? Math.round(Number(stats._avg.totalLessons)) : 0,
        totalLessons: stats?._sum.totalLessons || 0,
        totalHours: stats?._sum.totalHours ? Number(stats._sum.totalHours).toFixed(1) : "0",
        recentHires: hires?._count.id || 0,
        certifiedCount: certified?._count.id || 0,
      };
    });

    // Also get unassigned
    const unassignedStats = teamStats.find((s) => s.team === null);
    const unassignedStatuses = statusByTeam.filter((s) => s.team === null);

    if (unassignedStats) {
      teamData.push({
        team: "UNASSIGNED" as TutorTeam,
        totalTutors: unassignedStats._count.id,
        activeTutors: unassignedStatuses.find((s) => s.status === "ACTIVE")?._count.id || 0,
        pendingTutors: unassignedStatuses.find((s) => s.status === "PENDING")?._count.id || 0,
        avgRating: unassignedStats._avg.averageRating ? Number(unassignedStats._avg.averageRating).toFixed(2) : null,
        avgLessons: unassignedStats._avg.totalLessons ? Math.round(Number(unassignedStats._avg.totalLessons)) : 0,
        totalLessons: unassignedStats._sum.totalLessons || 0,
        totalHours: unassignedStats._sum.totalHours ? Number(unassignedStats._sum.totalHours).toFixed(1) : "0",
        recentHires: 0,
        certifiedCount: 0,
      });
    }

    return NextResponse.json({
      teams: teamData,
      totals: {
        tutors: teamData.reduce((sum, t) => sum + t.totalTutors, 0),
        active: teamData.reduce((sum, t) => sum + t.activeTutors, 0),
        lessons: teamData.reduce((sum, t) => sum + t.totalLessons, 0),
        recentHires: teamData.reduce((sum, t) => sum + t.recentHires, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch team stats" },
      { status: 500 }
    );
  }
}
