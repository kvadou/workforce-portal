import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorStatus, TutorTeam } from "@prisma/client";
import {
  recordStatusChange,
  recordTeamChange,
  recordCertificationChange,
  recordFieldUpdate,
} from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]
 * Get a single tutor profile with all related data
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

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
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
            bio: true,
            dateOfBirth: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            emergencyContactRelation: true,
            languages: true,
            organization: {
              select: {
                id: true,
                name: true,
                subdomain: true,
              },
            },
          },
        },
        certifications: {
          orderBy: { createdAt: "desc" },
        },
        labels: {
          orderBy: { createdAt: "desc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tutorProfile);
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tutors/[id]
 * Update a tutor profile
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
      status,
      team,
      baseHourlyRate,
      chessLevel,
      chessRating,
      noctieRating,
      chessableUsername,
      chessableProgress,
      pronouns,
      isSchoolCertified,
      isBqCertified,
      isPlaygroupCertified,
    } = body;

    // Get current profile for comparison (include userId for User updates)
    const currentProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });

    if (!currentProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status as TutorStatus;
    if (team !== undefined) updateData.team = team as TutorTeam;
    if (baseHourlyRate !== undefined)
      updateData.baseHourlyRate = parseFloat(baseHourlyRate);
    if (chessLevel !== undefined) updateData.chessLevel = chessLevel;
    if (chessRating !== undefined) updateData.chessRating = parseInt(chessRating);
    if (noctieRating !== undefined) updateData.noctieRating = parseInt(noctieRating);
    if (chessableUsername !== undefined)
      updateData.chessableUsername = chessableUsername;
    if (chessableProgress !== undefined)
      updateData.chessableProgress = parseInt(chessableProgress);
    if (pronouns !== undefined) updateData.pronouns = pronouns;
    if (isSchoolCertified !== undefined)
      updateData.isSchoolCertified = isSchoolCertified;
    if (isBqCertified !== undefined) updateData.isBqCertified = isBqCertified;
    if (isPlaygroupCertified !== undefined)
      updateData.isPlaygroupCertified = isPlaygroupCertified;

    // Handle status changes
    if (status === "QUIT" || status === "TERMINATED") {
      updateData.terminatedAt = new Date();
    } else if (status === "ACTIVE") {
      updateData.terminatedAt = null;
    }

    const tutorProfile = await prisma.tutorProfile.update({
      where: { id },
      data: updateData,
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

    // Record audit logs for changes
    const performedBy = session.user.id;
    const performedByName = session.user.name || undefined;

    if (status !== undefined && status !== currentProfile.status) {
      await recordStatusChange(id, currentProfile.status, status, performedBy, performedByName);
    }

    if (team !== undefined && team !== currentProfile.team) {
      await recordTeamChange(id, currentProfile.team, team, performedBy, performedByName);
    }

    if (isSchoolCertified !== undefined && isSchoolCertified !== currentProfile.isSchoolCertified) {
      await recordCertificationChange(id, "isSchoolCertified", currentProfile.isSchoolCertified, isSchoolCertified, performedBy, performedByName);
    }

    if (isBqCertified !== undefined && isBqCertified !== currentProfile.isBqCertified) {
      await recordCertificationChange(id, "isBqCertified", currentProfile.isBqCertified, isBqCertified, performedBy, performedByName);
    }

    if (isPlaygroupCertified !== undefined && isPlaygroupCertified !== currentProfile.isPlaygroupCertified) {
      await recordCertificationChange(id, "isPlaygroupCertified", currentProfile.isPlaygroupCertified, isPlaygroupCertified, performedBy, performedByName);
    }

    if (chessLevel !== undefined && chessLevel !== currentProfile.chessLevel) {
      await recordFieldUpdate(id, "chessLevel", currentProfile.chessLevel, chessLevel, performedBy, performedByName);
    }

    if (baseHourlyRate !== undefined) {
      const prevRate = currentProfile.baseHourlyRate ? Number(currentProfile.baseHourlyRate).toFixed(2) : null;
      const newRate = parseFloat(baseHourlyRate).toFixed(2);
      if (prevRate !== newRate) {
        await recordFieldUpdate(id, "baseHourlyRate", prevRate, newRate, performedBy, performedByName);
      }
    }

    // Update User fields if any were provided
    const userUpdateData: Record<string, unknown> = {};
    if (body.bio !== undefined) userUpdateData.bio = body.bio || null;
    if (body.phone !== undefined) userUpdateData.phone = body.phone || null;
    if (body.emergencyContactName !== undefined) userUpdateData.emergencyContactName = body.emergencyContactName || null;
    if (body.emergencyContactPhone !== undefined) userUpdateData.emergencyContactPhone = body.emergencyContactPhone || null;
    if (body.emergencyContactRelation !== undefined) userUpdateData.emergencyContactRelation = body.emergencyContactRelation || null;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: currentProfile.userId },
        data: userUpdateData,
      });
    }

    // Sync to OpsHub (fire-and-forget)
    const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
    const syncSecret = process.env.INTERNAL_API_SECRET;
    if (opsHubUrl && syncSecret && currentProfile.tutorCruncherId) {
      const syncPayload: Record<string, unknown> = { tutorCruncherId: currentProfile.tutorCruncherId };
      if (body.bio !== undefined) syncPayload.bio = body.bio;
      if (body.phone !== undefined) syncPayload.phone = body.phone;
      if (body.pronouns !== undefined) syncPayload.pronouns = body.pronouns;
      if (body.emergencyContactName !== undefined) syncPayload.emergencyContactName = body.emergencyContactName;
      if (body.emergencyContactPhone !== undefined) syncPayload.emergencyContactPhone = body.emergencyContactPhone;
      if (body.emergencyContactRelation !== undefined) syncPayload.emergencyContactRelation = body.emergencyContactRelation;

      fetch(`${opsHubUrl}/api/internal/tutor-profile-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${syncSecret}` },
        body: JSON.stringify(syncPayload),
      }).catch(() => {});
    }

    return NextResponse.json(tutorProfile);
  } catch (error) {
    console.error("Error updating tutor:", error);
    return NextResponse.json(
      { error: "Failed to update tutor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tutors/[id]
 * Delete a tutor profile (soft delete by setting status to TERMINATED)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete - set status to TERMINATED
    await prisma.tutorProfile.update({
      where: { id },
      data: {
        status: "TERMINATED",
        terminatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tutor:", error);
    return NextResponse.json(
      { error: "Failed to delete tutor" },
      { status: 500 }
    );
  }
}
