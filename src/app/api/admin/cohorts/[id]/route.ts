import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/cohorts/[id]
 * Get full cohort detail with all members and their profiles
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

    const cohort = await prisma.hiringCohort.findUnique({
      where: { id },
      include: {
        orientationSession: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            duration: true,
            zoomLink: true,
            hostName: true,
            maxParticipants: true,
          },
        },
        members: {
          include: {
            tutorProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    headshotUrl: true,
                    hireDate: true,
                    onboardingProgress: {
                      select: {
                        id: true,
                        status: true,
                        currentStep: true,
                        welcomeCompletedAt: true,
                        videosCompletedAt: true,
                        quizPassedAt: true,
                        quizScore: true,
                        profileCompletedAt: true,
                        w9CompletedAt: true,
                        orientationAttendedAt: true,
                        trainingCompletedAt: true,
                        trainingSessions: true,
                        shadowCompletedAt: true,
                        shadowLessons: true,
                        activatedAt: true,
                      },
                    },
                  },
                },
                labels: true,
                certifications: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // Reshape members to include relevant tutor profile fields at the top level
    const membersWithDetails = cohort.members.map((member) => ({
      id: member.id,
      cohortId: member.cohortId,
      tutorProfileId: member.tutorProfileId,
      joinedAt: member.joinedAt,
      notes: member.notes,
      tutorProfile: {
        id: member.tutorProfile.id,
        status: member.tutorProfile.status,
        team: member.tutorProfile.team,
        totalLessons: member.tutorProfile.totalLessons,
        totalHours: member.tutorProfile.totalHours,
        averageRating: member.tutorProfile.averageRating,
        isSchoolCertified: member.tutorProfile.isSchoolCertified,
        isBqCertified: member.tutorProfile.isBqCertified,
        isPlaygroupCertified: member.tutorProfile.isPlaygroupCertified,
        hireDate: member.tutorProfile.hireDate,
        activatedAt: member.tutorProfile.activatedAt,
        terminatedAt: member.tutorProfile.terminatedAt,
        user: member.tutorProfile.user,
        labels: member.tutorProfile.labels,
        certifications: member.tutorProfile.certifications,
      },
    }));

    return NextResponse.json({
      ...cohort,
      members: membersWithDetails,
    });
  } catch (error) {
    console.error("Error fetching cohort:", error);
    return NextResponse.json(
      { error: "Failed to fetch cohort" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/cohorts/[id]
 * Update cohort details
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
    const { name, status, description, notes, orientationSessionId } = body;

    // Check cohort exists
    const existingCohort = await prisma.hiringCohort.findUnique({
      where: { id },
    });
    if (!existingCohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // If name is changing, validate uniqueness
    if (name && name !== existingCohort.name) {
      const nameConflict = await prisma.hiringCohort.findUnique({
        where: { name },
      });
      if (nameConflict) {
        return NextResponse.json(
          { error: "A cohort with this name already exists" },
          { status: 409 }
        );
      }
    }

    // If orientation session is changing, validate it exists
    if (
      orientationSessionId &&
      orientationSessionId !== existingCohort.orientationSessionId
    ) {
      const orientationSession = await prisma.orientationSession.findUnique({
        where: { id: orientationSessionId },
      });
      if (!orientationSession) {
        return NextResponse.json(
          { error: "Orientation session not found" },
          { status: 404 }
        );
      }
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;
    if (orientationSessionId !== undefined)
      updateData.orientationSessionId = orientationSessionId;

    const cohort = await prisma.hiringCohort.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(cohort);
  } catch (error) {
    console.error("Error updating cohort:", error);
    return NextResponse.json(
      { error: "Failed to update cohort" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cohorts/[id]
 * Delete a cohort (cascade deletes CohortMember records, NOT tutor profiles)
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

    // Check cohort exists
    const existingCohort = await prisma.hiringCohort.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            tutorProfileId: true,
          },
        },
      },
    });
    if (!existingCohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // Remove cohort labels from all members before deleting
    const labelName = `Cohort: ${existingCohort.name}`;
    const memberProfileIds = existingCohort.members.map(
      (m) => m.tutorProfileId
    );

    if (memberProfileIds.length > 0) {
      await prisma.tutorLabel.deleteMany({
        where: {
          tutorProfileId: { in: memberProfileIds },
          name: labelName,
        },
      });
    }

    // Delete cohort (CohortMember records cascade delete via schema)
    await prisma.hiringCohort.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cohort:", error);
    return NextResponse.json(
      { error: "Failed to delete cohort" },
      { status: 500 }
    );
  }
}
