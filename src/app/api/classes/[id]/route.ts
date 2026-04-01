import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check if user can access this class
async function canAccessClass(userId: string, userRole: string, classId: string) {
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  if (isAdmin) return true;

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    select: { instructorId: true },
  });

  return classData?.instructorId === userId;
}

// GET /api/classes/[id] - Get a single class with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check access
    const hasAccess = await canAccessClass(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            progress: {
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    number: true,
                  },
                },
              },
            },
          },
        },
        currentLesson: {
          select: {
            id: true,
            title: true,
            number: true,
            module: {
              select: {
                id: true,
                title: true,
                curriculum: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        sessions: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                number: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error("Failed to fetch class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update a class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check access
    const hasAccess = await canAccessClass(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, color, currentLessonId, isActive } = body;

    const updated = await prisma.class.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(currentLessonId !== undefined && { currentLessonId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        currentLesson: {
          select: {
            id: true,
            title: true,
            number: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check access
    const hasAccess = await canAccessClass(session.user.id, session.user.role, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
