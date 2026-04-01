"use client";

import {
  TrophyIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  FlagIcon,
  FireIcon,
  BookOpenIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { parseBadgeColors } from "@/hooks/useBadges";
import { useTutorBadges } from "@/hooks/useTutorProfiles";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";

interface AchievementsTabProps {
  tutor: AdminTutorOverview;
}

const MILESTONE_LABELS: Record<string, string> = {
  LESSONS_TAUGHT: "Lessons Taught",
  HOURS_TAUGHT: "Hours Taught",
  REVIEWS_EARNED: "Reviews Earned",
  TRIAL_CONVERSIONS: "Trial Conversions",
};

function getMilestoneLabel(type: string): string {
  return MILESTONE_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AchievementsTab({ tutor }: AchievementsTabProps) {
  const { data: badgesData, isLoading: badgesLoading } = useTutorBadges(tutor.id);

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrophyIcon className="h-5 w-5 text-primary-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900">
            {tutor.badges.total}
          </p>
          <p className="text-xs text-neutral-500">Badges Earned</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="flex justify-center mb-2">
            <BoltIcon className="h-5 w-5 text-info" />
          </div>
          <p className="text-xl font-bold text-neutral-900">
            {tutor.points.total}
          </p>
          <p className="text-xs text-neutral-500">Total Points</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="flex justify-center mb-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-success" />
          </div>
          <p className="text-xl font-bold text-neutral-900">
            {tutor.points.monthly}
          </p>
          <p className="text-xs text-neutral-500">Monthly Points</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrophyIcon className="h-5 w-5 text-warning" />
          </div>
          <p className="text-xl font-bold text-neutral-900">
            {tutor.points.rank > 0 ? `#${tutor.points.rank}` : "Unranked"}
          </p>
          <p className="text-xs text-neutral-500">Rank</p>
        </div>
      </div>

      {/* All Earned Badges */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-4">
        <div className="flex items-center gap-2 p-4 pb-0">
          <TrophyIcon className="h-5 w-5 text-primary-500" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Badges Earned
          </h3>
        </div>
        <div className="p-4">
          {badgesLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 text-neutral-400 animate-spin" />
            </div>
          ) : !badgesData?.badges || badgesData.badges.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <TrophyIcon className="h-10 w-10 text-neutral-300" />
              <p className="text-sm text-neutral-400 mt-2">
                No badges earned yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {badgesData.badges.map((badge) => {
                const colors = parseBadgeColors(badge.colorScheme);
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-xl mb-2 shadow-sm"
                      style={{ backgroundColor: colors.bgColor }}
                    >
                      {badge.icon}
                    </div>
                    <p className="text-xs font-medium text-neutral-700 line-clamp-2">
                      {badge.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                      {badge.description}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 mb-4">
        <div className="flex items-center gap-2 p-4 pb-0">
          <FlagIcon className="h-5 w-5 text-accent-navy" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Milestones
          </h3>
        </div>
        <div className="p-4">
          {!tutor.milestones || tutor.milestones.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <FlagIcon className="h-10 w-10 text-neutral-300" />
              <p className="text-sm text-neutral-400 mt-2">
                No milestones yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tutor.milestones.map((milestone) => {
                const percentage = Math.min(
                  Math.round((milestone.value / milestone.threshold) * 100),
                  100
                );
                const isCompleted = milestone.value >= milestone.threshold;

                return (
                  <div key={milestone.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircleIcon className="h-4 w-4 text-success" />
                        ) : (
                          <FlagIcon className="h-4 w-4 text-neutral-400" />
                        )}
                        <span className="text-sm font-medium text-neutral-700">
                          {getMilestoneLabel(milestone.type)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {milestone.value} / {milestone.threshold}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all ${
                          isCompleted
                            ? "bg-success"
                            : "bg-primary-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Streaks */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="h-1.5 bg-accent-orange" />
        <div className="flex items-center gap-2 p-4 pb-0">
          <FireIcon className="h-5 w-5 text-accent-orange" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Streaks
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden text-center p-4 bg-white rounded-lg border border-neutral-200">
              <div className="absolute -top-4 -right-4 h-12 w-12 bg-accent-orange-light/30 rounded-full" />
              <div className="relative">
                <div className="h-12 w-12 bg-accent-orange rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm shadow-accent-orange-light">
                  <BoltIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-xl font-bold text-accent-orange">
                  {tutor.streaks.login.current}
                </p>
                <p className="text-xs font-medium text-neutral-600">
                  Login Streak
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Best: {tutor.streaks.login.longest}
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden text-center p-4 bg-warning-light rounded-lg border border-warning">
              <div className="absolute -top-4 -right-4 h-12 w-12 bg-warning-light/30 rounded-full" />
              <div className="relative">
                <div className="h-12 w-12 bg-warning rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm shadow-warning-light">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-xl font-bold text-warning">
                  {tutor.streaks.lesson.current}
                </p>
                <p className="text-xs font-medium text-neutral-600">
                  Lesson Streak
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Best: {tutor.streaks.lesson.longest}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
