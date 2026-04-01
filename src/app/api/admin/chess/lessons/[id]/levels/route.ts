import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, LevelGoalType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
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
 * GET /api/admin/chess/lessons/[id]/levels
 * Get all levels for a lesson, ordered by `order`
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

    // Verify lesson exists
    const lesson = await prisma.chessLesson.findUnique({ where: { id } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const levels = await prisma.chessLessonLevel.findMany({
      where: { lessonId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error fetching chess levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chess/lessons/[id]/levels
 * Create a new level for a lesson
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

    // Verify lesson exists
    const lesson = await prisma.chessLesson.findUnique({ where: { id } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const body = await req.json();
    const { fen, goal, goalType, targetSquares, playerColor, hintText, order } = body;

    if (!fen || !goal || !goalType) {
      return NextResponse.json(
        { error: "fen, goal, and goalType are required" },
        { status: 400 }
      );
    }

    if (!VALID_GOAL_TYPES.includes(goalType)) {
      return NextResponse.json(
        { error: `Invalid goalType. Must be one of: ${VALID_GOAL_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Auto-assign order if not provided
    let levelOrder = order !== undefined ? parseInt(order) : 0;
    if (order === undefined) {
      const maxOrder = await prisma.chessLessonLevel.aggregate({
        where: { lessonId: id },
        _max: { order: true },
      });
      levelOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const level = await prisma.chessLessonLevel.create({
      data: {
        lessonId: id,
        fen,
        goal,
        goalType: goalType as LevelGoalType,
        targetSquares: targetSquares || [],
        playerColor: playerColor || "white",
        hintText: hintText || null,
        order: levelOrder,
      },
    });

    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Error creating chess level:", error);
    return NextResponse.json(
      { error: "Failed to create level" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/chess/lessons/[id]/levels
 * Reorder levels via { reorder: [{ id, order }] }
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

    // Verify lesson exists
    const lesson = await prisma.chessLesson.findUnique({ where: { id } });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const body = await req.json();
    const { reorder } = body;

    if (!reorder || !Array.isArray(reorder)) {
      return NextResponse.json(
        { error: "reorder must be an array of { id, order } objects" },
        { status: 400 }
      );
    }

    // Validate all entries
    for (const item of reorder) {
      if (!item.id || item.order === undefined) {
        return NextResponse.json(
          { error: "Each reorder item must have id and order" },
          { status: 400 }
        );
      }
    }

    // Update all orders in a transaction
    await prisma.$transaction(
      reorder.map((item: { id: string; order: number }) =>
        prisma.chessLessonLevel.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    // Return updated levels
    const levels = await prisma.chessLessonLevel.findMany({
      where: { lessonId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("Error reordering chess levels:", error);
    return NextResponse.json(
      { error: "Failed to reorder levels" },
      { status: 500 }
    );
  }
}
