import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextRunTime } from "@/lib/scheduled-exports";
import type { UserRole, ExportFrequency } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/exports/[id]
 * Get a scheduled export with its history
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const scheduled = await prisma.scheduledExport.findUnique({
      where: { id },
    });

    if (!scheduled) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    const history = await prisma.exportHistory.findMany({
      where: { scheduledExportId: id },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ...scheduled,
      history,
    });
  } catch (error) {
    console.error("Error fetching export:", error);
    return NextResponse.json(
      { error: "Failed to fetch export" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/exports/[id]
 * Update a scheduled export
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      filters,
      columns,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      recipients,
      isActive,
    } = body;

    const existing = await prisma.scheduledExport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    // Recalculate next run if schedule changed
    let nextRunAt = existing.nextRunAt;
    if (frequency || timeOfDay || dayOfWeek !== undefined || dayOfMonth !== undefined) {
      nextRunAt = calculateNextRunTime(
        (frequency || existing.frequency) as ExportFrequency,
        timeOfDay || existing.timeOfDay,
        dayOfWeek ?? existing.dayOfWeek ?? undefined,
        dayOfMonth ?? existing.dayOfMonth ?? undefined
      );
    }

    const updated = await prisma.scheduledExport.update({
      where: { id },
      data: {
        name,
        description,
        filters: filters || undefined,
        columns: columns || undefined,
        frequency: frequency || undefined,
        dayOfWeek,
        dayOfMonth,
        timeOfDay,
        recipients: recipients || undefined,
        isActive,
        nextRunAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating export:", error);
    return NextResponse.json(
      { error: "Failed to update export" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/exports/[id]
 * Delete a scheduled export
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.scheduledExport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting export:", error);
    return NextResponse.json(
      { error: "Failed to delete export" },
      { status: 500 }
    );
  }
}
