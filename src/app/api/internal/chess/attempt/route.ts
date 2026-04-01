import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * POST /api/internal/chess/attempt
 * Record a puzzle attempt from ATS candidate widget
 * Body: { puzzleId, solved, timeMs, applicationId? }
 */
export async function POST(req: NextRequest) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { puzzleId, solved, timeMs } = body;

    if (!puzzleId || typeof solved !== "boolean") {
      return NextResponse.json(
        { error: "puzzleId and solved are required" },
        { status: 400 }
      );
    }

    // Verify puzzle exists
    const puzzle = await prisma.chessPuzzle.findUnique({
      where: { id: puzzleId },
      select: { id: true },
    });

    if (!puzzle) {
      return NextResponse.json(
        { error: "Puzzle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      solved,
      timeMs: timeMs || 0,
    });
  } catch (error) {
    console.error("Failed to record internal chess attempt:", error);
    return NextResponse.json(
      { error: "Failed to record attempt" },
      { status: 500 }
    );
  }
}
