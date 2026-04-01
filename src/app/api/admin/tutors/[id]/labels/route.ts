import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { recordLabelAdded, recordLabelRemoved } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/labels
 * Get all labels for a tutor
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

    const labels = await prisma.tutorLabel.findMany({
      where: { tutorProfileId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tutors/[id]/labels
 * Add a new label to a tutor
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    // Check if tutor profile exists
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // Check if label already exists for this tutor
    const existingLabel = await prisma.tutorLabel.findFirst({
      where: {
        tutorProfileId: id,
        name: name.trim(),
      },
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "Label already exists for this tutor" },
        { status: 409 }
      );
    }

    const label = await prisma.tutorLabel.create({
      data: {
        tutorProfileId: id,
        name: name.trim(),
        color: color || null,
        createdBy: session.user.id,
      },
    });

    // Record audit log
    await recordLabelAdded(id, name.trim(), session.user.id, session.user.name || undefined);

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("Error creating label:", error);
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tutors/[id]/labels
 * Remove a label from a tutor (label ID passed in query string)
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
    const { searchParams } = new URL(req.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json(
        { error: "Label ID is required" },
        { status: 400 }
      );
    }

    // Verify the label belongs to this tutor
    const label = await prisma.tutorLabel.findFirst({
      where: {
        id: labelId,
        tutorProfileId: id,
      },
    });

    if (!label) {
      return NextResponse.json(
        { error: "Label not found" },
        { status: 404 }
      );
    }

    await prisma.tutorLabel.delete({
      where: { id: labelId },
    });

    // Record audit log
    await recordLabelRemoved(id, label.name, session.user.id, session.user.name || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting label:", error);
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 }
    );
  }
}
