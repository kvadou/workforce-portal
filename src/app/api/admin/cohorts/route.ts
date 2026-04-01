import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, CohortStatus } from "@prisma/client";

/**
 * Custom sort order for CohortStatus: UPCOMING first, then ACTIVE, then COMPLETED
 */
const STATUS_SORT_ORDER: Record<CohortStatus, number> = {
  UPCOMING: 0,
  ACTIVE: 1,
  COMPLETED: 2,
};

/**
 * GET /api/admin/cohorts
 * List all hiring cohorts with member counts and status breakdown
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

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as CohortStatus | null;
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const cohorts = await prisma.hiringCohort.findMany({
      where,
      include: {
        orientationSession: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            duration: true,
            zoomLink: true,
            hostName: true,
          },
        },
        members: {
          include: {
            tutorProfile: {
              select: {
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Build summary with member stats and sort by status priority then session date desc
    const cohortSummaries = cohorts
      .map((cohort) => {
        const memberStats = {
          active: 0,
          inactive: 0,
          quit: 0,
          terminated: 0,
          pending: 0,
          total: cohort._count.members,
        };

        for (const member of cohort.members) {
          const tutorStatus = member.tutorProfile.status;
          switch (tutorStatus) {
            case "ACTIVE":
              memberStats.active++;
              break;
            case "INACTIVE":
              memberStats.inactive++;
              break;
            case "QUIT":
              memberStats.quit++;
              break;
            case "TERMINATED":
              memberStats.terminated++;
              break;
            case "PENDING":
              memberStats.pending++;
              break;
          }
        }

        return {
          id: cohort.id,
          name: cohort.name,
          status: cohort.status,
          description: cohort.description,
          notes: cohort.notes,
          orientationSessionId: cohort.orientationSessionId,
          orientationSession: cohort.orientationSession,
          createdBy: cohort.createdBy,
          createdAt: cohort.createdAt,
          updatedAt: cohort.updatedAt,
          memberCount: cohort._count.members,
          memberStats,
        };
      })
      .sort((a, b) => {
        // Sort by status priority first (UPCOMING, ACTIVE, COMPLETED)
        const statusDiff =
          STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Within same status, sort by createdAt descending (most recent first)
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return bDate - aDate;
      });

    return NextResponse.json({ cohorts: cohortSummaries });
  } catch (error) {
    console.error("Error fetching cohorts:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohorts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cohorts
 * Create a new hiring cohort
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

    const body = await req.json();
    const { name, status, description, orientationSessionId } = body;

    // Validate required fields
    if (!name || !orientationSessionId) {
      return NextResponse.json(
        { error: "name and orientationSessionId are required" },
        { status: 400 }
      );
    }

    // Validate name uniqueness
    const existing = await prisma.hiringCohort.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A cohort with this name already exists" },
        { status: 409 }
      );
    }

    // Validate orientation session exists
    const orientationSession = await prisma.orientationSession.findUnique({
      where: { id: orientationSessionId },
    });
    if (!orientationSession) {
      return NextResponse.json(
        { error: "Orientation session not found" },
        { status: 404 }
      );
    }

    const cohort = await prisma.hiringCohort.create({
      data: {
        name,
        status: status || "UPCOMING",
        description: description || null,
        orientationSessionId,
        createdBy: session.user.id,
      },
      include: {
        orientationSession: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            duration: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(cohort, { status: 201 });
  } catch (error) {
    console.error("Error creating cohort:", error);
    return NextResponse.json(
      { error: "Failed to create cohort" },
      { status: 500 }
    );
  }
}
