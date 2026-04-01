import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

const progressStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);

// GET /api/progress - Get user's lesson progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const lessonId = searchParams.get("lessonId");
    const moduleId = searchParams.get("moduleId");

    // If userId provided, verify it matches session or caller is ADMIN
    const userId = requestedUserId || session.user.id;
    if (requestedUserId && requestedUserId !== session.user.id) {
      if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If specific lesson requested
    if (lessonId) {
      const progress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              number: true,
              moduleId: true,
            },
          },
        },
      });
      return NextResponse.json(progress);
    }

    // Get all progress for user, optionally filtered by module
    const where: { userId: string; lesson?: { moduleId: string } } = { userId };
    if (moduleId) {
      where.lesson = { moduleId };
    }

    const progress = await prisma.lessonProgress.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            number: true,
            moduleId: true,
            module: {
              select: {
                id: true,
                title: true,
                curriculumId: true,
              },
            },
          },
        },
      },
      orderBy: {
        lesson: {
          number: "asc",
        },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Failed to fetch progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST /api/progress - Create or update lesson progress
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId: requestedUserId, lessonId, status, timeSpent, notes } = body;

    // Default to session user; only ADMIN can write to other users
    const userId = requestedUserId || session.user.id;
    if (requestedUserId && requestedUserId !== session.user.id) {
      if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData: {
      status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
      lastViewedAt: Date;
      startedAt?: Date;
      completedAt?: Date | null;
      timeSpent?: { increment: number };
      notes?: string;
    } = {
      lastViewedAt: now,
    };

    if (status) {
      const parsed = progressStatusSchema.safeParse(status);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid status. Must be NOT_STARTED, IN_PROGRESS, or COMPLETED" },
          { status: 400 }
        );
      }
      updateData.status = parsed.data;
      if (status === "IN_PROGRESS") {
        updateData.startedAt = now;
      } else if (status === "COMPLETED") {
        updateData.completedAt = now;
      } else if (status === "NOT_STARTED") {
        updateData.completedAt = null;
      }
    }

    if (timeSpent) {
      updateData.timeSpent = { increment: timeSpent };
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      create: {
        userId,
        lessonId,
        status: updateData.status || "IN_PROGRESS",
        startedAt: now,
        lastViewedAt: now,
        timeSpent: timeSpent || 0,
        notes,
      },
      update: updateData,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            number: true,
          },
        },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Failed to update progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
