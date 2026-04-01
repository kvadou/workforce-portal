import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorCertType, TutorCertStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/certifications
 * Get all certifications for a tutor
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

    const certifications = await prisma.tutorCertification.findMany({
      where: { tutorProfileId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch certifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tutors/[id]/certifications
 * Add a certification to a tutor
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

    const {
      type,
      status,
      earnedAt,
      expiresAt,
      documentUrl,
      notes,
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Certification type is required" },
        { status: 400 }
      );
    }

    // Check if this certification type already exists for the tutor
    const existing = await prisma.tutorCertification.findUnique({
      where: {
        tutorProfileId_type: {
          tutorProfileId: id,
          type: type as TutorCertType,
        },
      },
    });

    if (existing) {
      // Update existing certification
      const updated = await prisma.tutorCertification.update({
        where: { id: existing.id },
        data: {
          status: status as TutorCertStatus,
          earnedAt: earnedAt ? new Date(earnedAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          documentUrl,
          notes,
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Create new certification
    const certification = await prisma.tutorCertification.create({
      data: {
        tutorProfileId: id,
        type: type as TutorCertType,
        status: (status as TutorCertStatus) || "PENDING",
        earnedAt: earnedAt ? new Date(earnedAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        documentUrl,
        notes,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
      },
    });

    // Update the quick flags on the tutor profile
    const updateFlags: Record<string, boolean> = {};
    if (type === "SCHOOL_CERTIFIED" && status === "COMPLETED") {
      updateFlags.isSchoolCertified = true;
    }
    if (type === "BQ_CERTIFIED" && status === "COMPLETED") {
      updateFlags.isBqCertified = true;
    }
    if (type === "PLAYGROUP_CERTIFIED" && status === "COMPLETED") {
      updateFlags.isPlaygroupCertified = true;
    }

    if (Object.keys(updateFlags).length > 0) {
      await prisma.tutorProfile.update({
        where: { id },
        data: updateFlags,
      });
    }

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("Error creating certification:", error);
    return NextResponse.json(
      { error: "Failed to create certification" },
      { status: 500 }
    );
  }
}
