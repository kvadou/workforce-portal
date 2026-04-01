import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chess/puzzles
 * List puzzles with pagination and filters
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const theme = searchParams.get("theme") || "";
    const ratingMin = searchParams.get("ratingMin");
    const ratingMax = searchParams.get("ratingMax");
    const isActive = searchParams.get("isActive");

    const where: Prisma.ChessPuzzleWhereInput = {};

    if (search) {
      where.lichessId = { contains: search, mode: "insensitive" };
    }

    if (theme) {
      where.themes = { has: theme };
    }

    if (ratingMin || ratingMax) {
      where.rating = {};
      if (ratingMin) where.rating.gte = parseInt(ratingMin);
      if (ratingMax) where.rating.lte = parseInt(ratingMax);
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const [puzzles, total] = await Promise.all([
      prisma.chessPuzzle.findMany({
        where,
        include: {
          _count: {
            select: { attempts: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chessPuzzle.count({ where }),
    ]);

    return NextResponse.json({
      puzzles: puzzles.map((p) => ({
        ...p,
        attemptCount: p._count.attempts,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching puzzles:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chess/puzzles
 * Create a single puzzle manually
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { lichessId, fen, moves, rating, themes, openingTags, popularity, nbPlays, isActive } = body;

    if (!fen || !moves || rating === undefined) {
      return NextResponse.json(
        { error: "fen, moves, and rating are required" },
        { status: 400 }
      );
    }

    // Check for duplicate lichessId if provided
    if (lichessId) {
      const existing = await prisma.chessPuzzle.findUnique({
        where: { lichessId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A puzzle with this lichessId already exists" },
          { status: 409 }
        );
      }
    }

    const puzzle = await prisma.chessPuzzle.create({
      data: {
        lichessId: lichessId || null,
        fen,
        moves,
        rating: parseInt(rating),
        themes: themes || [],
        openingTags: openingTags || [],
        popularity: popularity ? parseInt(popularity) : 0,
        nbPlays: nbPlays ? parseInt(nbPlays) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(puzzle, { status: 201 });
  } catch (error) {
    console.error("Error creating puzzle:", error);
    return NextResponse.json(
      { error: "Failed to create puzzle" },
      { status: 500 }
    );
  }
}
