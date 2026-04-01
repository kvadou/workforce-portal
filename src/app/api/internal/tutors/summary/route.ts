import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * GET /api/internal/tutors/summary
 * Get aggregate tutor statistics for Acme dashboards
 *
 * Returns summary grouped by team and status
 */
export async function GET(req: NextRequest) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const team = searchParams.get("team");
    const status = searchParams.get("status");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (team) where.team = team;
    if (status) where.status = status;

    // Get overall counts
    const totalCount = await prisma.tutorProfile.count({ where });
    const activeCount = await prisma.tutorProfile.count({
      where: { ...where, status: "ACTIVE" },
    });

    // Get aggregate statistics
    const aggregates = await prisma.tutorProfile.aggregate({
      where,
      _avg: {
        totalLessons: true,
        totalHours: true,
        averageRating: true,
      },
      _sum: {
        totalLessons: true,
        totalHours: true,
      },
    });

    // Get counts by team
    const byTeam = await prisma.tutorProfile.groupBy({
      by: ["team"],
      where,
      _count: { id: true },
    });

    // Get counts by status
    const byStatus = await prisma.tutorProfile.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    });

    // Get certification counts (boolean fields need count, not sum)
    const schoolCertifiedCount = await prisma.tutorProfile.count({
      where: { ...where, isSchoolCertified: true },
    });
    const bqCertifiedCount = await prisma.tutorProfile.count({
      where: { ...where, isBqCertified: true },
    });
    const playgroupCertifiedCount = await prisma.tutorProfile.count({
      where: { ...where, isPlaygroupCertified: true },
    });

    return NextResponse.json({
      total: totalCount,
      active: activeCount,
      averages: {
        lessons: aggregates._avg.totalLessons ?? 0,
        hours: aggregates._avg.totalHours ? Number(aggregates._avg.totalHours) : 0,
        rating: aggregates._avg.averageRating ? Number(aggregates._avg.averageRating) : null,
      },
      totals: {
        lessons: aggregates._sum.totalLessons ?? 0,
        hours: aggregates._sum.totalHours ? Number(aggregates._sum.totalHours) : 0,
      },
      byTeam: byTeam.reduce((acc, item) => {
        acc[item.team || "UNASSIGNED"] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      certifications: {
        schoolCertified: schoolCertifiedCount,
        bqCertified: bqCertifiedCount,
        playgroupCertified: playgroupCertifiedCount,
      },
    });
  } catch (error) {
    console.error("Internal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
