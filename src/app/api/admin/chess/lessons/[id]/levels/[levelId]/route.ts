import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, LevelGoalType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; levelId: string }>;
}

const VALID_GOAL_TYPES: LevelGoalType[] = [
  "CAPTURE_TARGETS",
  "REACH_SQUARE",
  "CHECKMATE",
  "AVOID_CAPTURE",
  "SEQUENCE",
  "CUSTOM",
];

/**
 * PUT /api/admin/chess/lessons/[id]/levels/[levelId]
 * Update a single level
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

    const { id, levelId } = await params;

    // Verify lesson exists
    const lesson = await prisma.chessLesson.findUnique({ where: { id } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Verify level exists and belongs to this lesson
    const existing = await prisma.chessLessonLevel.findUnique({
      where: { id: levelId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }
    if (existing.lessonId !== id) {
      return NextResponse.json(
        { error: "Level does not belong to this lesson" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { fen, goal, goalType, targetSquares, playerColor, hintText, order } = body;

    if (goalType && !VALID_GOAL_TYPES.includes(goalType)) {
      return NextResponse.json(
        { error: `Invalid goalType. Must be one of: ${VALID_GOAL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (fen !== undefined) data.fen = fen;
    if (goal !== undefined) data.goal = goal;
    if (goalType !== undefined) data.goalType = goalType as LevelGoalType;
    if (targetSquares !== undefined) data.targetSquares = targetSquares;
    if (playerColor !== undefined) data.playerColor = playerColor;
    if (hintText !== undefined) data.hintText = hintText || null;
    if (order !== undefined) data.order = parseInt(order);

    const level = await prisma.chessLessonLevel.update({
      where: { id: levelId },
      data,
    });

    return NextResponse.json(level);
  } catch (error) {
    console.error("Error updating chess level:", error);
    return NextResponse.json(
      { error: "Failed to update level" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chess/lessons/[id]/levels/[levelId]
 * Delete a single level
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

    const { id, levelId } = await params;

    // Verify lesson exists
    const lesson = await prisma.chessLesson.findUnique({ where: { id } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Verify level exists and belongs to this lesson
    const existing = await prisma.chessLessonLevel.findUnique({
      where: { id: levelId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }
    if (existing.lessonId !== id) {
      return NextResponse.json(
        { error: "Level does not belong to this lesson" },
        { status: 400 }
      );
    }

    await prisma.chessLessonLevel.delete({ where: { id: levelId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chess level:", error);
    return NextResponse.json(
      { error: "Failed to delete level" },
      { status: 500 }
    );
  }
}
