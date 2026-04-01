import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, TutorStatus, TutorTeam } from "@prisma/client";

/**
 * POST /api/admin/tutors/bulk
 * Perform bulk actions on multiple tutors
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
    const { tutorIds, action, data } = body;

    if (!Array.isArray(tutorIds) || tutorIds.length === 0) {
      return NextResponse.json(
        { error: "No tutors selected" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "updateStatus": {
        const status = data.status as TutorStatus;
        if (!status) {
          return NextResponse.json(
            { error: "Status is required" },
            { status: 400 }
          );
        }

        const updateData: Record<string, unknown> = { status };
        if (status === "QUIT" || status === "TERMINATED") {
          updateData.terminatedAt = new Date();
        } else if (status === "ACTIVE") {
          updateData.terminatedAt = null;
        }

        result = await prisma.tutorProfile.updateMany({
          where: { id: { in: tutorIds } },
          data: updateData,
        });
        break;
      }

      case "updateTeam": {
        const team = data.team as TutorTeam;
        if (!team) {
          return NextResponse.json(
            { error: "Team is required" },
            { status: 400 }
          );
        }

        result = await prisma.tutorProfile.updateMany({
          where: { id: { in: tutorIds } },
          data: { team },
        });
        break;
      }

      case "addLabel": {
        const { name, color } = data;
        if (!name) {
          return NextResponse.json(
            { error: "Label name is required" },
            { status: 400 }
          );
        }

        // Create labels for each tutor (skip if already exists)
        const createData = tutorIds.map((tutorProfileId: string) => ({
          tutorProfileId,
          name: name.trim(),
          color: color || null,
          createdBy: session.user.id,
        }));

        // Use transaction to handle duplicates
        let created = 0;
        for (const labelData of createData) {
          const existing = await prisma.tutorLabel.findFirst({
            where: {
              tutorProfileId: labelData.tutorProfileId,
              name: labelData.name,
            },
          });
          if (!existing) {
            await prisma.tutorLabel.create({ data: labelData });
            created++;
          }
        }

        result = { count: created, message: `Added label to ${created} tutors` };
        break;
      }

      case "removeLabel": {
        const { labelName } = data;
        if (!labelName) {
          return NextResponse.json(
            { error: "Label name is required" },
            { status: 400 }
          );
        }

        result = await prisma.tutorLabel.deleteMany({
          where: {
            tutorProfileId: { in: tutorIds },
            name: labelName,
          },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
