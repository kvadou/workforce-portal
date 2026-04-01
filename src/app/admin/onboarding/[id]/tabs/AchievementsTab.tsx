"use client";

import { PuzzlePieceIcon, TrophyIcon } from "@heroicons/react/24/outline";
import type { OnboardingDetail } from "@/hooks/useOnboardingAdmin";

export function AchievementsTab({ data }: { data: OnboardingDetail }) {
  return (
    <div className="space-y-6">
      {/* PuzzlePieceIcon Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <PuzzlePieceIcon className="h-5 w-5 text-neutral-400" />
          PuzzlePieceIcon Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-body-xs text-neutral-500 mb-1">Puzzles Solved</p>
            <p className="text-heading-md text-neutral-900">
              {data.puzzlesSolved}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-body-xs text-neutral-500 mb-1">
              Puzzles Attempted
            </p>
            <p className="text-heading-md text-neutral-900">
              {data.puzzlesAttempted}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-body-xs text-neutral-500 mb-1">Best Streak</p>
            <p className="text-heading-md text-neutral-900">
              {data.puzzleBestStreak}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-body-xs text-neutral-500 mb-1">
              Current Rating
            </p>
            <p className="text-heading-md text-neutral-900">
              {data.puzzleCurrentRating || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-neutral-400" />
          Badges
        </h2>
        <p className="text-body-sm text-neutral-500">
          Badges can be viewed on the full tutor profile once the tutor has been
          activated.
        </p>
      </div>
    </div>
  );
}
