"use client";

import Link from "next/link";
import { TrophyIcon, ChevronRightIcon, BoltIcon } from "@heroicons/react/24/outline";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl: string | null;
  points: number;
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  currentUserPoints?: number;
  period?: "weekly" | "monthly" | "all";
  showViewAll?: boolean;
}

function getRankStyles(rank: number) {
  switch (rank) {
    case 1:
      return {
        bg: "bg-gradient-to-r from-warning to-warning",
        text: "text-warning-dark",
        ring: "ring-2 ring-warning ring-offset-2",
        medal: "text-warning",
      };
    case 2:
      return {
        bg: "bg-gradient-to-r from-neutral-300 to-neutral-400",
        text: "text-neutral-700",
        ring: "ring-2 ring-neutral-300 ring-offset-2",
        medal: "text-neutral-400",
      };
    case 3:
      return {
        bg: "bg-gradient-to-r from-accent-orange to-warning",
        text: "text-accent-orange",
        ring: "ring-2 ring-accent-orange ring-offset-2",
        medal: "text-accent-orange",
      };
    default:
      return {
        bg: "bg-neutral-100",
        text: "text-neutral-600",
        ring: "",
        medal: "",
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LeaderboardWidget({
  entries,
  currentUserRank,
  currentUserPoints,
  period = "monthly",
  showViewAll = true,
}: LeaderboardWidgetProps) {
  const periodLabels = {
    weekly: "This Week",
    monthly: "This Month",
    all: "All Time",
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-warning" />
            <h2 className="font-semibold text-neutral-900">Top Tutors</h2>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {periodLabels[period]}
            </span>
          </div>
          {showViewAll && (
            <Link
              href="/growth?tab=leaderboard"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Current user rank highlight */}
      {currentUserRank && currentUserRank > 3 && (
        <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                #{currentUserRank}
              </div>
              <span className="text-sm font-medium text-primary-700">Your Position</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600">
              <BoltIcon className="h-4 w-4" />
              <span className="font-bold">{currentUserPoints?.toLocaleString()}</span>
              <span className="text-sm">pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard entries */}
      <div className="divide-y divide-neutral-100">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <TrophyIcon className="h-12 w-12 text-neutral-200 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No leaderboard data yet</p>
          </div>
        ) : (
          entries.map((entry) => {
            const styles = getRankStyles(entry.rank);
            const isTopThree = entry.rank <= 3;

            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                  isTopThree ? "bg-gradient-to-r from-warning-light/50 to-transparent" : ""
                }`}
              >
                {/* Rank */}
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${styles.bg} ${styles.text}`}
                >
                  {isTopThree ? <TrophyIcon className={`h-4 w-4 ${styles.medal}`} /> : entry.rank}
                </div>

                {/* Avatar */}
                <div
                  className={`h-10 w-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold ${
                    isTopThree ? styles.ring : ""
                  }`}
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(entry.name)
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{entry.name}</p>
                  {isTopThree && (
                    <p className="text-xs text-warning">
                      {entry.rank === 1 ? "Gold" : entry.rank === 2 ? "Silver" : "Bronze"}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className="flex items-center gap-1 text-right">
                  <BoltIcon className={`h-4 w-4 ${isTopThree ? "text-warning" : "text-neutral-400"}`} />
                  <span className={`font-bold ${isTopThree ? "text-warning" : "text-neutral-700"}`}>
                    {entry.points.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
