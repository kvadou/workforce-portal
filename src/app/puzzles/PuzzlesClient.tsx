"use client";

import { useState, useCallback } from "react";
import { ClientHeader } from "@/components/portal/ClientHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const PuzzleSolver = dynamic(
  () => import("@/components/chess/PuzzleSolver").then((m) => m.PuzzleSolver),
  { ssr: false }
);
import {
  useDailyPuzzle,
  useNextPuzzle,
  usePuzzleStats,
  useSubmitPuzzleAttempt,
} from "@/hooks/usePuzzles";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import {
  ArrowPathIcon,
  BoltIcon,
  ClockIcon,
  FireIcon,
  FlagIcon,
  PuzzlePieceIcon,
  StarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function PuzzlesClient() {
  const { data: dailyData, isLoading: dailyLoading } = useDailyPuzzle();
  const {
    data: nextData,
    isLoading: nextLoading,
    refetch: refetchNext,
  } = useNextPuzzle();
  const { data: stats, isLoading: statsLoading } = usePuzzleStats();
  const submitAttempt = useSubmitPuzzleAttempt();

  const [mode, setMode] = useState<"daily" | "training">("daily");

  const puzzle =
    mode === "daily" ? dailyData?.puzzle : nextData?.puzzle;
  const isLoading = mode === "daily" ? dailyLoading : nextLoading;

  const handleComplete = useCallback(
    (result: {
      solved: boolean;
      usedHint: boolean;
      moveCount: number;
      timeMs: number;
    }) => {
      if (!puzzle) return;
      submitAttempt.mutate({
        puzzleId: puzzle.id,
        data: result,
      });
    },
    [puzzle, submitAttempt]
  );

  const handleNext = useCallback(() => {
    refetchNext();
  }, [refetchNext]);

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />
      <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <PortalPageHeader
          icon={PuzzlePieceIcon}
          title="Chess Puzzles"
          description="Sharpen your tactical vision with daily puzzles"
          colorScheme="amber"
          flush
        />

        <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Stats Bar */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FlagIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-800">
                    {stats.puzzleRating}
                  </div>
                  <div className="text-xs text-neutral-500">Rating</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-800">
                    {stats.puzzlesSolved}
                  </div>
                  <div className="text-xs text-neutral-500">Solved</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-orange-light flex items-center justify-center">
                  <FireIcon className="w-5 h-5 text-accent-orange" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-800">
                    {stats.currentStreak}
                  </div>
                  <div className="text-xs text-neutral-500">Day Streak</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-info" />
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-800">
                    {stats.bestStreak}
                  </div>
                  <div className="text-xs text-neutral-500">Best Streak</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main puzzle area */}
          <div className="lg:col-span-2">
            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("daily")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "daily"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <BoltIcon className="w-4 h-4 inline mr-1" />
                Daily PuzzlePieceIcon
              </button>
              <button
                onClick={() => setMode("training")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "training"
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <FlagIcon className="w-4 h-4 inline mr-1" />
                Training
              </button>
            </div>

            <Card>
              <CardContent className="p-6">
                {isLoading && (
                  <div className="flex items-center justify-center py-20">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                )}

                {!isLoading && !puzzle && (
                  <div className="text-center py-20 text-neutral-500">
                    <PuzzlePieceIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>
                      {mode === "daily"
                        ? "No daily puzzle available. Import puzzles to get started!"
                        : "No puzzles available. Import the Lichess puzzle database."}
                    </p>
                  </div>
                )}

                {!isLoading && puzzle && (
                  <>
                    {mode === "daily" && dailyData?.alreadySolved && (
                      <div className="mb-4 px-4 py-2 bg-success-light border border-success rounded-lg text-success-dark text-sm">
                        You already solved today&apos;s puzzle! Come back
                        tomorrow for a new one, or try training mode.
                      </div>
                    )}
                    <PuzzleSolver
                      puzzleId={puzzle.id}
                      fen={puzzle.fen}
                      moves={puzzle.moves}
                      rating={puzzle.rating}
                      themes={puzzle.themes || []}
                      onComplete={handleComplete}
                      onNext={mode === "training" ? handleNext : undefined}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Theme browser link */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-neutral-800 mb-2">
                  PuzzlePieceIcon Themes
                </h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Practice specific tactics like forks, pins, and checkmates
                </p>
                <Link
                  href="/puzzles/themes"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  Browse Themes
                </Link>
              </CardContent>
            </Card>

            {/* Learn chess link */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-neutral-800 mb-2">
                  Learn Chess
                </h3>
                <p className="text-sm text-neutral-500 mb-3">
                  Interactive lessons on how each piece moves and basic tactics
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  Start Learning
                </Link>
              </CardContent>
            </Card>

            {/* Quick stats */}
            {stats && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-3">
                    Your Progress
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Total solved</span>
                      <span className="font-medium">
                        {stats.puzzlesSolved}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Success rate</span>
                      <span className="font-medium">
                        {stats.puzzlesSolved + stats.puzzlesFailed > 0
                          ? Math.round(
                              (stats.puzzlesSolved /
                                (stats.puzzlesSolved + stats.puzzlesFailed)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Time spent</span>
                      <span className="font-medium">
                        {Math.round(stats.totalTimeMs / 60000)}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Hints used</span>
                      <span className="font-medium">{stats.hintsUsed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
    </div>
  );
}
