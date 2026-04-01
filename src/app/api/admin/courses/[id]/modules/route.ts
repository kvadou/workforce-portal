import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, ModuleContentType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/[id]/modules
 * Get all modules for a course
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

    const { id: courseId } = await params;

    const modules = await prisma.trainingModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { progress: true },
        },
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses/[id]/modules
 * Create a new module for a course
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

    const { id: courseId } = await params;
    const body = await req.json();
    const {
      title,
      description,
      contentType,
      videoUrl,
      content,
      resourceUrls,
      hasQuiz,
      quizQuestions,
      passingScore,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.trainingCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get max order
    const maxOrder = await prisma.trainingModule.aggregate({
      where: { courseId },
      _max: { order: true },
    });

    const newModule = await prisma.trainingModule.create({
      data: {
        courseId,
        title,
        description,
        order: (maxOrder._max.order ?? -1) + 1,
        contentType: (contentType as ModuleContentType) || "VIDEO",
        videoUrl,
        content,
        resourceUrls: resourceUrls ?? [],
        hasQuiz: hasQuiz ?? false,
        quizQuestions,
        passingScore: passingScore ?? 80,
      },
    });

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[id]/modules
 * Reorder modules (bulk update)
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

    const { id: courseId } = await params;
    const body = await req.json();
    const { moduleOrder } = body; // Array of { id, order }

    if (!Array.isArray(moduleOrder)) {
      return NextResponse.json(
        { error: "moduleOrder array is required" },
        { status: 400 }
      );
    }

    // Update all modules in a transaction
    await prisma.$transaction(
      moduleOrder.map((item: { id: string; order: number }) =>
        prisma.trainingModule.update({
          where: { id: item.id, courseId },
          data: { order: item.order },
        })
      )
    );

    const modules = await prisma.trainingModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Error reordering modules:", error);
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 }
    );
  }
}
