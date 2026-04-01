import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExportData, convertToCSV, calculateNextRunTime } from "@/lib/scheduled-exports";
import type { UserRole, ExportType, ExportFrequency } from "@prisma/client";

/**
 * GET /api/admin/exports
 * List scheduled exports
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
    const includeHistory = searchParams.get("includeHistory") === "true";

    const exports = await prisma.scheduledExport.findMany({
      orderBy: { createdAt: "desc" },
    });

    let history: unknown[] = [];
    if (includeHistory) {
      history = await prisma.exportHistory.findMany({
        orderBy: { startedAt: "desc" },
        take: 50,
      });
    }

    return NextResponse.json({
      scheduledExports: exports,
      ...(includeHistory && { recentHistory: history }),
    });
  } catch (error) {
    console.error("Error fetching exports:", error);
    return NextResponse.json(
      { error: "Failed to fetch exports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/exports
 * Create a scheduled export or run an immediate export
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
      action, // "run" for immediate, "schedule" for scheduled
      name,
      description,
      exportType,
      filters,
      columns,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      recipients,
    } = body;

    if (action === "run") {
      // Run immediate export
      if (!exportType) {
        return NextResponse.json(
          { error: "exportType is required" },
          { status: 400 }
        );
      }

      const result = await generateExportData(
        exportType as ExportType,
        filters,
        columns
      );

      const csv = convertToCSV(result);

      // Log to history
      await prisma.exportHistory.create({
        data: {
          exportType: exportType as ExportType,
          fileName: `${exportType.toLowerCase()}_${Date.now()}.csv`,
          rowCount: result.rowCount,
          status: "COMPLETED",
          completedAt: new Date(),
          createdBy: session.user.id,
        },
      });

      // Return CSV as download
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${exportType.toLowerCase()}_export.csv"`,
        },
      });
    }

    if (action === "schedule") {
      // Create scheduled export
      if (!name || !exportType || !frequency || !recipients?.length) {
        return NextResponse.json(
          { error: "name, exportType, frequency, and recipients are required" },
          { status: 400 }
        );
      }

      const nextRunAt = calculateNextRunTime(
        frequency as ExportFrequency,
        timeOfDay || "09:00",
        dayOfWeek,
        dayOfMonth
      );

      const scheduled = await prisma.scheduledExport.create({
        data: {
          name,
          description,
          exportType: exportType as ExportType,
          filters: filters || {},
          columns: columns || [],
          frequency: frequency as ExportFrequency,
          dayOfWeek,
          dayOfMonth,
          timeOfDay: timeOfDay || "09:00",
          recipients,
          nextRunAt,
          createdBy: session.user.id,
        },
      });

      return NextResponse.json(scheduled, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'run' or 'schedule'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error with export:", error);
    return NextResponse.json(
      { error: "Failed to process export request" },
      { status: 500 }
    );
  }
}
