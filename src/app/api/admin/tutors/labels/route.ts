import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/tutors/labels
 * Get all unique labels used across all tutors
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

    // Get all unique labels with count
    const labels = await prisma.tutorLabel.groupBy({
      by: ["name", "color"],
      _count: {
        tutorProfileId: true,
      },
      orderBy: {
        _count: {
          tutorProfileId: "desc",
        },
      },
    });

    return NextResponse.json({
      labels: labels.map((l) => ({
        name: l.name,
        color: l.color,
        count: l._count.tutorProfileId,
      })),
    });
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}
