"use client";

import Link from "next/link";
import { useAchievements } from "@/hooks/useAchievements";
import { parseBadgeColors } from "@/hooks/useBadges";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FireIcon,
  FlagIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
interface ProfileAchievementsTabProps {
  points?: { total: number; monthly: number; rank: number };
}

const streakLabels: Record<string, string> = {
  LOGIN: "Login Streak",
  LESSONS_DAILY: "Lesson Streak",
  PUZZLES_DAILY: "Puzzle Streak",
};

export function ProfileAchievementsTab({ points }: ProfileAchievementsTabProps) {
  const { data: achievements, isLoading, error } = useAchievements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !achievements) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-error gap-3">
        <ExclamationCircleIcon className="w-10 h-10" />
        <p className="text-sm font-medium">Failed to load achievements</p>
      </div>
    );
  }

  const { badges, streaks, milestones } = achievements;

  // Find the best (longest) streak across all streak types
  const bestStreak =
    streaks.length > 0
      ? Math.max(...streaks.map((s) => s.longestStreak))
      : 0;

  return (
    <div className="space-y-8">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <TrophyIcon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary-700">
            {badges.totalEarned}
          </p>
          <p className="text-xs text-neutral-500">
            of {badges.totalAvailable} Badges
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <BoltIcon className="w-6 h-6 text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold text-warning">
            {points?.total ?? 0}
          </p>
          <p className="text-xs text-neutral-500">Total Points</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <TrophyIcon className="w-6 h-6 text-accent-navy mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent-navy">
            {points?.rank ? `#${points.rank}` : "\u2014"}
          </p>
          <p className="text-xs text-neutral-500">Rank</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <FireIcon className="w-6 h-6 text-accent-orange mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent-orange">{bestStreak}</p>
          <p className="text-xs text-neutral-500">Best Streak</p>
        </div>
      </div>

      {/* 2. Badge Grid */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-primary-500" />
          Earned Badges
          <span className="text-sm text-neutral-400 font-normal">
            ({badges.totalEarned})
          </span>
        </h3>

        {badges.earned.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <TrophyIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">
              Complete training and lessons to earn badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.earned.map((badge) => {
              const colors = parseBadgeColors(badge.colorScheme);
              return (
                <div
                  key={badge.id}
                  className="border-2 rounded-xl p-4 text-center transition-transform hover:scale-105 cursor-default"
                  style={{
                    backgroundColor: colors.bgColor,
                    borderColor: colors.borderColor,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: colors.color + "22" }}
                  >
                    <span
                      className="text-2xl"
                      role="img"
                      aria-label={badge.title}
                    >
                      {badge.icon}
                    </span>
                  </div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: colors.color }}
                  >
                    {badge.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {badge.description}
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Milestones Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <FlagIcon className="w-5 h-5 text-success" />
          Milestone Progress
        </h3>

        {milestones.progress.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <FlagIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">No milestones to track yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {milestones.progress.map((milestone) => {
              const nextThreshold = milestone.thresholds.find(
                (t) => t > milestone.current
              );
              const progressTarget =
                nextThreshold ||
                milestone.thresholds[milestone.thresholds.length - 1] ||
                1;
              const progressPercent = Math.min(
                (milestone.current / progressTarget) * 100,
                100
              );

              return (
                <div key={milestone.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">
                      {milestone.label}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {milestone.current} / {nextThreshold ?? progressTarget}
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-navy-light rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {milestone.thresholds.map((threshold) => {
                      const isAchieved = milestone.achieved.includes(threshold);
                      return (
                        <div
                          key={threshold}
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            isAchieved
                              ? "bg-success-light text-success-dark"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {isAchieved && (
                            <CheckCircleIcon className="w-3 h-3" />
                          )}
                          {threshold}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Streaks Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <FireIcon className="w-5 h-5 text-accent-orange" />
          Streaks
        </h3>

        {streaks.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <FireIcon className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">
              Start logging in daily to build your streak!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {streaks.map((streak) => {
              const isActive = streak.currentStreak > 0;
              const label =
                streakLabels[streak.type] || streak.type;

              return (
                <div
                  key={streak.type}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isActive
                      ? "bg-accent-orange-light border-accent-orange"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FireIcon
                      className={`w-5 h-5 ${
                        isActive ? "text-accent-orange" : "text-neutral-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          isActive ? "text-neutral-900" : "text-neutral-500"
                        }`}
                      >
                        {label}
                      </p>
                      {streak.lastActivityDate && (
                        <p className="text-xs text-neutral-400">
                          Last:{" "}
                          {new Date(
                            streak.lastActivityDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        isActive ? "text-accent-orange" : "text-neutral-400"
                      }`}
                    >
                      {streak.currentStreak}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Best: {streak.longestStreak} days
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer Link */}
      <div className="text-center">
        <Link
          href="/growth"
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          View Full Achievements Page
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
