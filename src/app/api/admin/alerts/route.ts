import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAllEngagementChecks } from "@/lib/engagement-alerts";
import type { UserRole, AlertStatus, AlertType, AlertSeverity } from "@prisma/client";

/**
 * GET /api/admin/alerts
 * Get all engagement alerts with filtering
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as AlertStatus | null;
    const type = searchParams.get("type") as AlertType | null;
    const severity = searchParams.get("severity") as AlertSeverity | null;
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const alerts = await prisma.engagementAlert.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { severity: "desc" },
        { triggeredAt: "desc" },
      ],
      take: limit,
    });

    // Get counts by status and type
    const [statusCounts, typeCounts, severityCounts] = await Promise.all([
      prisma.engagementAlert.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.engagementAlert.groupBy({
        by: ["type"],
        where: { status: "ACTIVE" },
        _count: true,
      }),
      prisma.engagementAlert.groupBy({
        by: ["severity"],
        where: { status: "ACTIVE" },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      alerts,
      summary: {
        byStatus: statusCounts.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {}
        ),
        byType: typeCounts.reduce(
          (acc, t) => ({ ...acc, [t.type]: t._count }),
          {}
        ),
        bySeverity: severityCounts.reduce(
          (acc, s) => ({ ...acc, [s.severity]: s._count }),
          {}
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/alerts
 * Trigger engagement check to generate new alerts
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await runAllEngagementChecks();

    return NextResponse.json({
      success: true,
      alertsCreated: result,
    });
  } catch (error) {
    console.error("Error running engagement checks:", error);
    return NextResponse.json(
      { error: "Failed to run engagement checks" },
      { status: 500 }
    );
  }
}
