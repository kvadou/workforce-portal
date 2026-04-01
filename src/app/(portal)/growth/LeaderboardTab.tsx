"use client";

import { useState } from "react";
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const TEAMS = [
  { value: "", label: "All Teams" },
  { value: "LA", label: "Los Angeles" },
  { value: "NYC", label: "New York City" },
  { value: "SF", label: "San Francisco" },
  { value: "ONLINE", label: "Online" },
  { value: "WESTSIDE", label: "Westside" },
  { value: "EASTSIDE", label: "Eastside" },
];

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "all", label: "All Time" },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRankDisplay(rank: number) {
  if (rank === 1) {
    return {
      icon: <TrophyIcon className="w-6 h-6 text-warning" />,
      bg: "bg-gradient-to-br from-warning via-warning to-warning-light",
      ring: "ring-4 ring-warning/30",
      text: "text-warning-dark",
      badge: "Gold",
      badgeColor: "bg-warning-light text-warning-dark",
    };
  }
  if (rank === 2) {
    return {
      icon: <TrophyIcon className="w-5 h-5 text-neutral-400" />,
      bg: "bg-gradient-to-br from-neutral-300 via-neutral-200 to-neutral-400",
      ring: "ring-4 ring-neutral-300/30",
      text: "text-neutral-700",
      badge: "Silver",
      badgeColor: "bg-neutral-100 text-neutral-600",
    };
  }
  if (rank === 3) {
    return {
      icon: <TrophyIcon className="w-5 h-5 text-accent-orange" />,
      bg: "bg-gradient-to-br from-accent-orange via-warning to-accent-orange",
      ring: "ring-4 ring-accent-orange/30",
      text: "text-accent-orange",
      badge: "Bronze",
      badgeColor: "bg-accent-orange-light text-accent-orange",
    };
  }
  return {
    icon: null,
    bg: "bg-neutral-100",
    ring: "",
    text: "text-neutral-600",
    badge: null,
    badgeColor: "",
  };
}

export function LeaderboardTab() {
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("monthly");
  const [team, setTeam] = useState<string>("");

  const { data, isLoading, error } = useLeaderboard({
    period,
    limit: 50,
    team: team || undefined,
  });

  const currentUser = data?.currentUser;
  const leaderboard = data?.leaderboard || [];

  return (
    <>
      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Period Filter */}
            <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all min-h-[44px] ${
                    period === p.value
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 active:bg-neutral-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Team Filter */}
            <div className="relative sm:ml-auto">
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="appearance-none w-full sm:w-48 px-4 py-2.5 pr-10 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                {TEAMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <UsersIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current User Position (if not in top 3) */}
      {currentUser && currentUser.rank > 3 && (
        <Card className="border-0 shadow-sm mb-6 bg-gradient-to-r from-primary-50 via-primary-100/50 to-primary-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">#{currentUser.rank}</span>
                </div>
                <div>
                  <p className="font-semibold text-primary-900">Your Position</p>
                  <p className="text-sm text-primary-600">
                    {currentUser.rank <= 10
                      ? "Top 10! Keep it up!"
                      : `${currentUser.rank - 10} spots away from Top 10`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary-600">
                  <BoltIcon className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {(period === "weekly"
                      ? currentUser.weeklyPoints
                      : period === "monthly"
                      ? currentUser.monthlyPoints
                      : currentUser.points
                    ).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-primary-500">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {/* Podium Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="order-2 sm:order-1 sm:pt-8">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-5 w-12 mx-auto" />
              </div>
            </div>
            <div className="order-1 sm:order-2">
              <div className="rounded-xl border border-neutral-200 bg-warning-light p-4">
                <Skeleton className="w-20 h-20 rounded-full mx-auto mb-3 bg-warning-light" />
                <Skeleton className="h-5 w-28 mx-auto mb-2 bg-warning-light" />
                <Skeleton className="h-6 w-16 mx-auto bg-warning-light" />
              </div>
            </div>
            <div className="order-3 sm:pt-12">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <Skeleton className="w-14 h-14 rounded-full mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-5 w-10 mx-auto" />
              </div>
            </div>
          </div>

          {/* Leaderboard List Skeleton */}
          <SkeletonList count={10} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <p className="text-error">Failed to load leaderboard</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && leaderboard.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-warning-light to-accent-orange-light flex items-center justify-center">
              <TrophyIcon className="w-8 h-8 text-warning" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1">No leaderboard data yet</h3>
            <p className="text-sm text-neutral-500">
              Complete courses and earn points to appear here!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {!isLoading && !error && leaderboard.length > 0 && (
        <div className="space-y-6">
          {/* Top 3 Podium - Stack on mobile, 3-col on tablet+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Second Place */}
            <div className="order-2 sm:order-1 sm:pt-8">
              {leaderboard[1] && (
                <Card className="border-0 shadow-sm hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="relative inline-block mb-3">
                      <div
                        className={`w-16 h-16 rounded-lg ${getRankDisplay(2).bg} flex items-center justify-center text-white text-xl font-bold ${getRankDisplay(2).ring}`}
                      >
                        {leaderboard[1].avatarUrl ? (
                          <img
                            src={leaderboard[1].avatarUrl}
                            alt={leaderboard[1].name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(leaderboard[1].name)
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow">
                        {getRankDisplay(2).icon}
                      </div>
                    </div>
                    <p className="font-semibold text-neutral-900 truncate">{leaderboard[1].name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRankDisplay(2).badgeColor}`}>
                      Silver
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-2 text-neutral-600">
                      <BoltIcon className="w-4 h-4 text-warning" />
                      <span className="font-bold">{leaderboard[1].points.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* First Place */}
            <div className="order-1 sm:order-2">
              {leaderboard[0] && (
                <Card className="border-0 shadow-sm bg-gradient-to-b from-warning-light to-white border-warning">
                  <CardContent className="p-4 text-center">
                    <div className="relative inline-block mb-3">
                      <div
                        className={`w-20 h-20 rounded-lg ${getRankDisplay(1).bg} flex items-center justify-center text-white text-2xl font-bold ${getRankDisplay(1).ring}`}
                      >
                        {leaderboard[0].avatarUrl ? (
                          <img
                            src={leaderboard[0].avatarUrl}
                            alt={leaderboard[0].name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(leaderboard[0].name)
                        )}
                      </div>
                      <div className="absolute -top-2 -right-1 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        {getRankDisplay(1).icon}
                      </div>
                    </div>
                    <p className="font-bold text-lg text-neutral-900 truncate">{leaderboard[0].name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRankDisplay(1).badgeColor}`}>
                      Gold
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-2 text-warning">
                      <BoltIcon className="w-5 h-5" />
                      <span className="text-xl font-bold">{leaderboard[0].points.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Third Place */}
            <div className="order-3 sm:pt-12">
              {leaderboard[2] && (
                <Card className="border-0 shadow-sm hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="relative inline-block mb-3">
                      <div
                        className={`w-14 h-14 rounded-lg ${getRankDisplay(3).bg} flex items-center justify-center text-white text-lg font-bold ${getRankDisplay(3).ring}`}
                      >
                        {leaderboard[2].avatarUrl ? (
                          <img
                            src={leaderboard[2].avatarUrl}
                            alt={leaderboard[2].name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(leaderboard[2].name)
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow">
                        {getRankDisplay(3).icon}
                      </div>
                    </div>
                    <p className="font-semibold text-neutral-900 truncate text-sm">{leaderboard[2].name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRankDisplay(3).badgeColor}`}>
                      Bronze
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-2 text-neutral-600">
                      <BoltIcon className="w-4 h-4 text-warning" />
                      <span className="font-bold text-sm">{leaderboard[2].points.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Rest of Leaderboard (4-50) */}
          <Card className="border-0 shadow-sm overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {leaderboard.slice(3).map((entry, index) => {
                  const rank = index + 4;
                  const isCurrentUser = currentUser?.tutorProfileId === entry.tutorProfileId;

                  return (
                    <div
                      key={entry.tutorProfileId}
                      className={`flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                        isCurrentUser ? "bg-primary-50 hover:bg-primary-50" : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-10 text-center">
                        <span
                          className={`text-lg font-bold ${
                            isCurrentUser ? "text-primary-600" : "text-neutral-400"
                          }`}
                        >
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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

                      {/* Name & Team */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            isCurrentUser ? "text-primary-900" : "text-neutral-900"
                          }`}
                        >
                          {entry.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        {entry.team && (
                          <p className="text-xs text-neutral-500">
                            {TEAMS.find((t) => t.value === entry.team)?.label || entry.team}
                          </p>
                        )}
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-1 text-right">
                        <BoltIcon
                          className={`w-4 h-4 ${isCurrentUser ? "text-primary-500" : "text-neutral-400"}`}
                        />
                        <span
                          className={`font-bold ${
                            isCurrentUser ? "text-primary-600" : "text-neutral-700"
                          }`}
                        >
                          {entry.points.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
          </Card>

          {/* Points Breakdown for Current User */}
          {currentUser?.breakdown && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" />
                  Your Points Breakdown
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Courses", value: currentUser.breakdown.courses, icon: TrophyIcon },
                    { label: "Lessons", value: currentUser.breakdown.lessons, icon: UsersIcon },
                    { label: "Streaks", value: currentUser.breakdown.streaks, icon: BoltIcon },
                    { label: "Achievements", value: currentUser.breakdown.achievements, icon: TrophyIcon },
                    { label: "Quality", value: currentUser.breakdown.quality, icon: TrophyIcon },
                    { label: "Engagement", value: currentUser.breakdown.engagement, icon: ArrowTrendingUpIcon },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-neutral-50 rounded-xl p-3 text-center"
                    >
                      <item.icon className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-neutral-900">
                        {item.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
