import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/cohorts/[id]/members
 * Bulk add members to a cohort. Upserts to avoid duplicates.
 * Also syncs a "Cohort: {name}" TutorLabel for each added member.
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
    const { tutorProfileIds } = body;

    if (!Array.isArray(tutorProfileIds) || tutorProfileIds.length === 0) {
      return NextResponse.json(
        { error: "tutorProfileIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Verify cohort exists
    const cohort = await prisma.hiringCohort.findUnique({
      where: { id },
    });
    if (!cohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // Verify all tutor profiles exist
    const existingProfiles = await prisma.tutorProfile.findMany({
      where: { id: { in: tutorProfileIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingProfiles.map((p) => p.id));
    const missingIds = tutorProfileIds.filter(
      (tpId: string) => !existingIds.has(tpId)
    );
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: `Tutor profiles not found: ${missingIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    // Upsert members and labels in a transaction
    const labelName = `Cohort: ${cohort.name}`;

    await prisma.$transaction(async (tx) => {
      // Upsert each member (skipDuplicates isn't available for createMany with unique constraints on all DBs)
      for (const tutorProfileId of tutorProfileIds) {
        await tx.cohortMember.upsert({
          where: {
            cohortId_tutorProfileId: {
              cohortId: id,
              tutorProfileId,
            },
          },
          create: {
            cohortId: id,
            tutorProfileId,
          },
          update: {
            // No-op if already exists
          },
        });

        // Upsert the cohort label on each tutor profile
        await tx.tutorLabel.upsert({
          where: {
            tutorProfileId_name: {
              tutorProfileId,
              name: labelName,
            },
          },
          create: {
            tutorProfileId,
            name: labelName,
            color: "#6366f1", // Indigo for cohort labels
            createdBy: session.user.id,
          },
          update: {
            // No-op if already exists
          },
        });
      }
    });

    // Fetch updated member list
    const updatedMembers = await prisma.cohortMember.findMany({
      where: { cohortId: id },
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
              },
            },
            labels: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      added: tutorProfileIds.length,
      totalMembers: updatedMembers.length,
      members: updatedMembers,
    });
  } catch (error) {
    console.error("Error adding cohort members:", error);
    return NextResponse.json(
      { error: "Failed to add cohort members" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cohorts/[id]/members
 * Remove a single member from a cohort. Also removes the cohort label.
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
    const body = await req.json();
    const { tutorProfileId } = body;

    if (!tutorProfileId) {
      return NextResponse.json(
        { error: "tutorProfileId is required" },
        { status: 400 }
      );
    }

    // Verify cohort exists
    const cohort = await prisma.hiringCohort.findUnique({
      where: { id },
    });
    if (!cohort) {
      return NextResponse.json(
        { error: "Cohort not found" },
        { status: 404 }
      );
    }

    // Verify membership exists
    const membership = await prisma.cohortMember.findUnique({
      where: {
        cohortId_tutorProfileId: {
          cohortId: id,
          tutorProfileId,
        },
      },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Member not found in this cohort" },
        { status: 404 }
      );
    }

    // Remove member and cohort label in a transaction
    const labelName = `Cohort: ${cohort.name}`;

    await prisma.$transaction(async (tx) => {
      // Delete the membership
      await tx.cohortMember.delete({
        where: {
          cohortId_tutorProfileId: {
            cohortId: id,
            tutorProfileId,
          },
        },
      });

      // Remove the cohort label
      await tx.tutorLabel.deleteMany({
        where: {
          tutorProfileId,
          name: labelName,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing cohort member:", error);
    return NextResponse.json(
      { error: "Failed to remove cohort member" },
      { status: 500 }
    );
  }
}
