import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, ModuleContentType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string; moduleId: string }>;
}

/**
 * GET /api/admin/courses/[id]/modules/[moduleId]
 * Get module details
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

    const { id: courseId, moduleId } = await params;

    const trainingModule = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        _count: {
          select: { progress: true },
        },
      },
    });

    if (!trainingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get completion stats
    const progressStats = await prisma.moduleProgress.groupBy({
      by: ["status"],
      where: { moduleId },
      _count: true,
    });

    const stats = {
      totalStarted: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
    };

    progressStats.forEach((stat) => {
      stats.totalStarted += stat._count;
      if (stat.status === "NOT_STARTED") stats.notStarted = stat._count;
      if (stat.status === "IN_PROGRESS") stats.inProgress = stat._count;
      if (stat.status === "COMPLETED") stats.completed = stat._count;
    });

    return NextResponse.json({
      ...trainingModule,
      progressStats: stats,
    });
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[id]/modules/[moduleId]
 * Update a module
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

    const { id: courseId, moduleId } = await params;
    const body = await req.json();
    const {
      title,
      description,
      order,
      contentType,
      videoUrl,
      content,
      resourceUrls,
      hasQuiz,
      quizQuestions,
      passingScore,
    } = body;

    // Verify module exists
    const existing = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const updatedModule = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: {
        title,
        description,
        order,
        contentType: contentType as ModuleContentType,
        videoUrl,
        content,
        resourceUrls,
        hasQuiz,
        quizQuestions,
        passingScore,
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]/modules/[moduleId]
 * Delete a module
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

    const { id: courseId, moduleId } = await params;

    // Verify module exists
    const existing = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    await prisma.trainingModule.delete({
      where: { id: moduleId },
    });

    // Reorder remaining modules
    const remainingModules = await prisma.trainingModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    await prisma.$transaction(
      remainingModules.map((mod, index) =>
        prisma.trainingModule.update({
          where: { id: mod.id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
