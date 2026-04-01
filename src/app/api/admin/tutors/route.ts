import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorStatus, TutorTeam } from "@prisma/client";

/**
 * GET /api/admin/tutors
 * Get all tutor profiles with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as TutorStatus | null;
    const team = searchParams.get("team") as TutorTeam | null;
    const labels = searchParams.get("labels"); // comma-separated label names
    const hasCertification = searchParams.get("certification"); // school,bq,playgroup
    const minLessons = searchParams.get("minLessons");
    const maxLessons = searchParams.get("maxLessons");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (status) {
      where.status = status;
    }

    if (team) {
      where.team = team;
    }

    // Filter by labels
    if (labels) {
      const labelNames = labels.split(",").map((l) => l.trim()).filter(Boolean);
      if (labelNames.length > 0) {
        where.labels = {
          some: {
            name: { in: labelNames },
          },
        };
      }
    }

    // Filter by certifications
    if (hasCertification) {
      const certs = hasCertification.split(",").map((c) => c.trim());
      const certFilters: Record<string, boolean>[] = [];
      if (certs.includes("school")) certFilters.push({ isSchoolCertified: true });
      if (certs.includes("bq")) certFilters.push({ isBqCertified: true });
      if (certs.includes("playgroup")) certFilters.push({ isPlaygroupCertified: true });
      if (certFilters.length > 0) {
        where.OR = certFilters;
      }
    }

    // Filter by lesson count
    if (minLessons || maxLessons) {
      where.totalLessons = {};
      if (minLessons) {
        (where.totalLessons as Record<string, number>).gte = parseInt(minLessons);
      }
      if (maxLessons) {
        (where.totalLessons as Record<string, number>).lte = parseInt(maxLessons);
      }
    }

    // Get tutors with pagination
    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              headshotUrl: true,
              hireDate: true,
              role: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  subdomain: true,
                },
              },
            },
          },
          certifications: true,
          labels: true,
          _count: {
            select: {
              notes: true,
            },
          },
        },
        orderBy: [
          { status: "asc" },
          { user: { name: "asc" } },
        ],
        skip,
        take: limit,
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.tutorProfile.groupBy({
      by: ["status"],
      _count: true,
    });

    const teamStats = await prisma.tutorProfile.groupBy({
      by: ["team"],
      _count: true,
      where: { status: "ACTIVE" },
    });

    // Get label-based counts for Rejected and Dormant
    const [rejectedCount, dormantCount, totalCount] = await Promise.all([
      prisma.tutorProfile.count({
        where: { labels: { some: { name: "Rejected" } } },
      }),
      prisma.tutorProfile.count({
        where: { labels: { some: { name: "Dormant" } } },
      }),
      prisma.tutorProfile.count(),
    ]);

    return NextResponse.json({
      tutors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.reduce(
          (acc, { status, _count }) => ({ ...acc, [status]: _count }),
          {} as Record<string, number>
        ),
        byTeam: teamStats.reduce(
          (acc, { team, _count }) => ({ ...acc, [team || "UNASSIGNED"]: _count }),
          {} as Record<string, number>
        ),
        byLabel: {
          rejected: rejectedCount,
          dormant: dormantCount,
        },
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tutors
 * Create a new tutor profile (for existing users who are already tutors)
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
    const {
      userId,
      team,
      baseHourlyRate,
      chessLevel,
      chessRating,
      pronouns,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if tutor profile already exists
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Tutor profile already exists for this user" },
        { status: 400 }
      );
    }

    // Create tutor profile
    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId,
        status: "ACTIVE",
        team: team as TutorTeam | undefined,
        baseHourlyRate: baseHourlyRate ? parseFloat(baseHourlyRate) : undefined,
        chessLevel,
        chessRating: chessRating ? parseInt(chessRating) : undefined,
        pronouns,
        hireDate: user.hireDate || new Date(),
        activatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tutorProfile, { status: 201 });
  } catch (error) {
    console.error("Error creating tutor profile:", error);
    return NextResponse.json(
      { error: "Failed to create tutor profile" },
      { status: 500 }
    );
  }
}
