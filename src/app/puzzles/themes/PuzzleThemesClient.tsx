"use client";

import { ClientHeader } from "@/components/portal/ClientHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { usePuzzleThemes } from "@/hooks/usePuzzles";
import { ArrowLeftIcon, ArrowPathIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Theme categories for organization
const THEME_CATEGORIES: Record<string, string[]> = {
  Phases: [
    "opening",
    "middlegame",
    "endgame",
    "pawnEndgame",
    "rookEndgame",
    "bishopEndgame",
    "knightEndgame",
    "queenEndgame",
  ],
  Motifs: [
    "fork",
    "pin",
    "skewer",
    "discoveredAttack",
    "doubleCheck",
    "sacrifice",
    "deflection",
    "decoy",
    "interference",
    "overloading",
    "xRayAttack",
    "zugzwang",
    "attraction",
  ],
  Tactics: [
    "mate",
    "mateIn1",
    "mateIn2",
    "mateIn3",
    "mateIn4",
    "backRankMate",
    "smotheredMate",
    "hookMate",
    "anastasiaMate",
    "arabianMate",
    "bodenMate",
  ],
  Themes: [
    "short",
    "long",
    "veryLong",
    "oneMove",
    "crushing",
    "advantage",
    "equality",
    "defensiveMove",
    "quietMove",
    "hangingPiece",
    "trappedPiece",
    "exposedKing",
    "castling",
    "enPassant",
    "promotion",
    "underPromotion",
    "kingsideAttack",
    "queensideAttack",
  ],
};

function formatThemeName(theme: string): string {
  return theme
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/In (\d)/, "in $1")
    .trim();
}

export default function PuzzleThemesClient() {
  const { data, isLoading } = usePuzzleThemes();

  const themeMap = new Map(
    data?.themes.map((t) => [t.theme, t.count]) ?? []
  );

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/puzzles"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Puzzles
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <PuzzlePieceIcon className="w-7 h-7 text-primary-600" />
            PuzzlePieceIcon Themes
          </h1>
          <p className="text-neutral-500 mt-1">
            Practice specific tactical patterns
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-8">
            {Object.entries(THEME_CATEGORIES).map(([category, themes]) => {
              const availableThemes = themes.filter(
                (t) => themeMap.has(t) && (themeMap.get(t) ?? 0) > 0
              );
              if (availableThemes.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-neutral-700 mb-3">
                    {category}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableThemes.map((theme) => (
                      <Link key={theme} href={`/puzzles?theme=${theme}`}>
                        <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="font-medium text-neutral-800 text-sm">
                              {formatThemeName(theme)}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              {themeMap.get(theme)} puzzles
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Uncategorized themes */}
            {(() => {
              const allCategorized = new Set(
                Object.values(THEME_CATEGORIES).flat()
              );
              const uncategorized = (data?.themes ?? []).filter(
                (t) => !allCategorized.has(t.theme)
              );
              if (uncategorized.length === 0) return null;

              return (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700 mb-3">
                    Other
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {uncategorized.map(({ theme, count }) => (
                      <Link key={theme} href={`/puzzles?theme=${theme}`}>
                        <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="font-medium text-neutral-800 text-sm">
                              {formatThemeName(theme)}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              {count} puzzles
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </DashboardLayout>
    </div>
  );
}
