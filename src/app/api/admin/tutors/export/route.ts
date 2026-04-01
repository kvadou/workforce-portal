import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorStatus, TutorTeam } from "@prisma/client";

/**
 * GET /api/admin/tutors/export
 * Export tutor list to CSV
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as TutorStatus | null;
    const team = searchParams.get("team") as TutorTeam | null;
    const labels = searchParams.get("labels");
    const hasCertification = searchParams.get("certification");
    const minLessons = searchParams.get("minLessons");
    const maxLessons = searchParams.get("maxLessons");
    const columns = searchParams.get("columns")?.split(",") || [
      "name",
      "email",
      "phone",
      "status",
      "team",
      "totalLessons",
      "averageRating",
      "hireDate",
    ];

    // Build where clause (same as list endpoint)
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

    if (minLessons || maxLessons) {
      where.totalLessons = {};
      if (minLessons) {
        (where.totalLessons as Record<string, number>).gte = parseInt(minLessons);
      }
      if (maxLessons) {
        (where.totalLessons as Record<string, number>).lte = parseInt(maxLessons);
      }
    }

    // Fetch tutors
    const tutors = await prisma.tutorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            hireDate: true,
          },
        },
        labels: true,
      },
      orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
    });

    // Column definitions
    const columnDefs: Record<string, { header: string; getValue: (t: typeof tutors[0]) => string }> = {
      name: { header: "Name", getValue: (t) => t.user.name || "" },
      email: { header: "Email", getValue: (t) => t.user.email || "" },
      phone: { header: "Phone", getValue: (t) => t.user.phone || "" },
      status: { header: "Status", getValue: (t) => t.status },
      team: { header: "Team", getValue: (t) => t.team || "" },
      totalLessons: { header: "Total Lessons", getValue: (t) => t.totalLessons.toString() },
      totalHours: { header: "Total Hours", getValue: (t) => (t.totalHours ? Number(t.totalHours).toFixed(1) : "") },
      averageRating: { header: "Avg Rating", getValue: (t) => (t.averageRating ? Number(t.averageRating).toFixed(2) : "") },
      hireDate: { header: "Hire Date", getValue: (t) => (t.user.hireDate ? new Date(t.user.hireDate).toISOString().split("T")[0] : "") },
      activatedAt: { header: "Activated", getValue: (t) => (t.activatedAt ? new Date(t.activatedAt).toISOString().split("T")[0] : "") },
      labels: { header: "Labels", getValue: (t) => t.labels.map((l) => l.name).join("; ") },
      schoolCertified: { header: "School Certified", getValue: (t) => t.isSchoolCertified ? "Yes" : "No" },
      bqCertified: { header: "BQ Certified", getValue: (t) => t.isBqCertified ? "Yes" : "No" },
      playgroupCertified: { header: "Playgroup Certified", getValue: (t) => t.isPlaygroupCertified ? "Yes" : "No" },
      baseHourlyRate: { header: "Hourly Rate", getValue: (t) => (t.baseHourlyRate ? `$${Number(t.baseHourlyRate).toFixed(2)}` : "") },
      chessLevel: { header: "Chess Level", getValue: (t) => t.chessLevel || "" },
      pronouns: { header: "Pronouns", getValue: (t) => t.pronouns || "" },
    };

    // Validate columns
    const validColumns = columns.filter((c) => columnDefs[c]);
    if (validColumns.length === 0) {
      return NextResponse.json({ error: "No valid columns specified" }, { status: 400 });
    }

    // Build CSV
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headers = validColumns.map((c) => columnDefs[c].header);
    const rows = tutors.map((tutor) =>
      validColumns.map((c) => escapeCSV(columnDefs[c].getValue(tutor)))
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tutors-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting tutors:", error);
    return NextResponse.json(
      { error: "Failed to export tutors" },
      { status: 500 }
    );
  }
}
