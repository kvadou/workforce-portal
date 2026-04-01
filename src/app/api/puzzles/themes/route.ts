import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function GET() {
  try {
    // Get all active puzzles and aggregate themes
    const puzzles = await prisma.chessPuzzle.findMany({
      where: { isActive: true },
      select: { themes: true },
    });

    const themeCounts: Record<string, number> = {};
    for (const puzzle of puzzles) {
      for (const theme of puzzle.themes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }

    const themes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Failed to fetch puzzle themes:", error);
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
  }
}
