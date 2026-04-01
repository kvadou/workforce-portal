import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgressStatus } from "@prisma/client";
import type { UserRole } from "@prisma/client";

// POST /api/students/[id]/progress - Update student lesson progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: studentId } = await params;
    const body = await request.json();
    const { lessonId, status, score, notes } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const progress = await prisma.studentLessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId },
      },
      create: {
        studentId,
        lessonId,
        status: (status || "IN_PROGRESS") as ProgressStatus,
        completedAt: status === "COMPLETED" ? now : null,
        score,
        notes,
      },
      update: {
        ...(status && {
          status: status as ProgressStatus,
          completedAt: status === "COMPLETED" ? now : null,
        }),
        ...(score !== undefined && { score }),
        ...(notes !== undefined && { notes }),
      },
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
    console.error("Failed to update student progress:", error);
    return NextResponse.json(
      { error: "Failed to update student progress" },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id]/progress - Bulk update progress for multiple lessons
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: studentId } = await params;
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "updates array is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const results = await Promise.all(
      updates.map((update: { lessonId: string; status?: string; score?: number; notes?: string }) =>
        prisma.studentLessonProgress.upsert({
          where: {
            studentId_lessonId: { studentId, lessonId: update.lessonId },
          },
          create: {
            studentId,
            lessonId: update.lessonId,
            status: (update.status || "IN_PROGRESS") as ProgressStatus,
            completedAt: update.status === "COMPLETED" ? now : null,
            score: update.score,
            notes: update.notes,
          },
          update: {
            ...(update.status && {
              status: update.status as ProgressStatus,
              completedAt: update.status === "COMPLETED" ? now : null,
            }),
            ...(update.score !== undefined && { score: update.score }),
            ...(update.notes !== undefined && { notes: update.notes }),
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to bulk update student progress:", error);
    return NextResponse.json(
      { error: "Failed to bulk update student progress" },
      { status: 500 }
    );
  }
}
