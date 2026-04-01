"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const MiniBoard = dynamic(
  () => import("@/components/chess/MiniBoard").then((m) => m.MiniBoard),
  { ssr: false }
);
import { useDailyPuzzle, usePuzzleStats } from "@/hooks/usePuzzles";
import {
  FireIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface DailyPuzzleWidgetProps {
  featured?: boolean;
}

export function DailyPuzzleWidget({ featured = false }: DailyPuzzleWidgetProps) {
  const { data, isLoading } = useDailyPuzzle();
  const { data: stats } = usePuzzleStats();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-neutral-200 shadow-sm ${featured ? "h-full" : ""}`}>
        <div className={`flex items-center justify-center ${featured ? "h-64" : "h-32"}`}>
          <ArrowPathIcon className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!data?.puzzle) {
    if (featured) {
      return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden h-full">
          <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
          <div className="p-6 flex flex-col items-center justify-center h-full text-center min-h-[240px]">
            <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
              <PuzzlePieceIcon className="h-8 w-8 text-primary-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">Chess Puzzles</h2>
            <p className="text-sm text-neutral-500 mb-4">Sharpen your chess skills with daily puzzles</p>
            <Link
              href="/puzzles"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-semibold"
            >
              Explore Puzzles
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  // Featured variant — large hero card for dashboard
  if (featured) {
    return (
      <Link href="/puzzles" className="block h-full group">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden h-full hover:shadow-sm hover:border-primary-200 transition-all">
          <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <PuzzlePieceIcon className="h-5 w-5 text-primary-500" />
                Daily Puzzle
              </h2>
              {stats && stats.currentStreak > 0 && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-accent-orange bg-accent-orange-light px-3 py-1 rounded-full">
                  <FireIcon className="h-4 w-4" />
                  {stats.currentStreak} day streak
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Chessboard with play overlay */}
              <div className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-sm ring-1 ring-neutral-200">
                <MiniBoard fen={data.puzzle.fen} size={180} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <PlayIcon className="h-7 w-7 text-primary-600 ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm text-neutral-500 mb-1">Today&apos;s Challenge</p>
                <p className="text-3xl font-bold text-neutral-900 mb-4">
                  Rating {data.puzzle.rating}
                </p>

                {data.alreadySolved ? (
                  <div className="inline-flex items-center gap-2 text-success bg-success-light px-4 py-2 rounded-xl mb-4">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-semibold">Solved today!</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl group-hover:bg-primary-600 transition-colors font-semibold shadow-sm shadow-primary-200 mb-4 text-base">
                    Solve Puzzle
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}

                {stats && (
                  <p className="text-sm text-neutral-400 mt-2">
                    {stats.puzzlesSolved} puzzles solved &middot; Rating {stats.puzzleRating}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default compact variant
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <PuzzlePieceIcon className="h-4 w-4" />
              Daily Puzzle
            </h3>
            {stats && stats.currentStreak > 0 && (
              <span className="flex items-center gap-1 text-xs text-warning-light">
                <FireIcon className="h-3 w-3" />
                {stats.currentStreak} day streak
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4">
            <MiniBoard fen={data.puzzle.fen} size={96} />
            <div className="flex-1">
              <div className="text-sm text-neutral-500 mb-1">
                Rating: {data.puzzle.rating}
              </div>
              {data.alreadySolved ? (
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <CheckCircleIcon className="h-4 w-4" />
                  Solved today!
                </div>
              ) : (
                <Link
                  href="/puzzles"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                  Solve Puzzle
                </Link>
              )}
              {stats && (
                <div className="text-xs text-neutral-400 mt-2">
                  {stats.puzzlesSolved} puzzles solved &middot; Rating{" "}
                  {stats.puzzleRating}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
