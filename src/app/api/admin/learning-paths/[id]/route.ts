import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/learning-paths/[id]
 * Get a single learning path with courses
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

    const path = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                duration: true,
                difficulty: true,
                category: true,
                isPublished: true,
                grantsCertification: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
    }

    return NextResponse.json(path);
  } catch (error) {
    console.error("Error fetching learning path:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning path" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/learning-paths/[id]
 * Update a learning path
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
    const { title, slug, description, targetRole, isRequired, isPublished, courseIds } = body;

    // Check if path exists
    const existing = await prisma.learningPath.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Learning path not found" }, { status: 404 });
    }

    // Check for duplicate slug (excluding current)
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.learningPath.findUnique({
        where: { slug },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A learning path with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update path and courses in transaction
    const path = await prisma.$transaction(async (tx) => {
      // Update path
      const updated = await tx.learningPath.update({
        where: { id },
        data: {
          title,
          slug,
          description,
          targetRole,
          isRequired,
          isPublished,
        },
      });

      // Update courses if provided
      if (courseIds !== undefined) {
        // Delete existing course associations
        await tx.learningPathCourse.deleteMany({
          where: { learningPathId: id },
        });

        // Create new associations
        if (courseIds.length > 0) {
          await tx.learningPathCourse.createMany({
            data: courseIds.map((courseId: string, index: number) => ({
              learningPathId: id,
              courseId,
              order: index,
              isRequired: true,
            })),
          });
        }
      }

      return updated;
    });

    // Fetch updated path with courses
    const result = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating learning path:", error);
    return NextResponse.json(
      { error: "Failed to update learning path" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/learning-paths/[id]
 * Delete a learning path
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

    await prisma.learningPath.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting learning path:", error);
    return NextResponse.json(
      { error: "Failed to delete learning path" },
      { status: 500 }
    );
  }
}
