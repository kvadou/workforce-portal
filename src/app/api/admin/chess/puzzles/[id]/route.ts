import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/chess/puzzles/[id]
 * Get a single puzzle with attempt stats
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

    const puzzle = await prisma.chessPuzzle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...puzzle,
      attemptCount: puzzle._count.attempts,
      _count: undefined,
    });
  } catch (error) {
    console.error("Error fetching puzzle:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzle" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/chess/puzzles/[id]
 * Update a puzzle (rating, themes, isActive, etc.)
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

    const existing = await prisma.chessPuzzle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const body = await req.json();
    const { rating, themes, openingTags, isActive, fen, moves, popularity, nbPlays } = body;

    const data: Record<string, unknown> = {};
    if (rating !== undefined) data.rating = parseInt(rating);
    if (themes !== undefined) data.themes = themes;
    if (openingTags !== undefined) data.openingTags = openingTags;
    if (isActive !== undefined) data.isActive = isActive;
    if (fen !== undefined) data.fen = fen;
    if (moves !== undefined) data.moves = moves;
    if (popularity !== undefined) data.popularity = parseInt(popularity);
    if (nbPlays !== undefined) data.nbPlays = parseInt(nbPlays);

    const puzzle = await prisma.chessPuzzle.update({
      where: { id },
      data,
    });

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error("Error updating puzzle:", error);
    return NextResponse.json(
      { error: "Failed to update puzzle" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/chess/puzzles/[id]
 * Soft delete (set isActive=false) or hard delete with ?hard=true
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
    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    const existing = await prisma.chessPuzzle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    if (hard) {
      await prisma.chessPuzzle.delete({ where: { id } });
      return NextResponse.json({ success: true, action: "hard_delete" });
    }

    await prisma.chessPuzzle.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, action: "soft_delete" });
  } catch (error) {
    console.error("Error deleting puzzle:", error);
    return NextResponse.json(
      { error: "Failed to delete puzzle" },
      { status: 500 }
    );
  }
}
