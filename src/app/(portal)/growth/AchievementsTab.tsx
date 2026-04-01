"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAchievements, EarnedBadge, AvailableBadge, MilestoneProgress } from "@/hooks/useAchievements";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  FireIcon,
  FlagIcon,
  LightBulbIcon,
  LockClosedIcon,
  PlayCircleIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Skeleton, SkeletonStats, SkeletonCard } from "@/components/ui/skeleton";

// Map icon names (from DB) to Heroicon components
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Star: StarIcon,
  PlayCircle: PlayCircleIcon,
  Brain: LightBulbIcon,
  User: UserIcon,
  FileText: DocumentTextIcon,
  Calendar: CalendarDaysIcon,
  GraduationCap: AcademicCapIcon,
  Flame: FireIcon,
  Zap: BoltIcon,
  Target: FlagIcon,
  Trophy: TrophyIcon,
  Award: TrophyIcon,
  BookOpen: BookOpenIcon,
  Sparkles: SparklesIcon,
  CheckCircle: CheckCircleIcon,
};

function parseColorScheme(colorScheme: string) {
  try {
    return JSON.parse(colorScheme);
  } catch {
    return { color: "var(--primary-500)", bgColor: "var(--primary-50)", borderColor: "var(--primary-200)" };
  }
}

const streakConfig: Record<string, { label: string; icon: typeof BoltIcon; color: string; bgColor: string; gradient: string }> = {
  LOGIN: { label: "Login Streak", icon: BoltIcon, color: "text-accent-orange", bgColor: "bg-accent-orange-light", gradient: "from-accent-orange to-error" },
  LESSONS_DAILY: { label: "Daily Lessons", icon: BookOpenIcon, color: "text-warning", bgColor: "bg-warning-light", gradient: "from-warning to-accent-orange" },
  LESSONS_WEEKLY: { label: "Weekly Lessons", icon: CalendarDaysIcon, color: "text-info", bgColor: "bg-info-light", gradient: "from-info to-info-light" },
};

const milestoneIcons: Record<string, typeof TrophyIcon> = {
  LESSONS_TAUGHT: BookOpenIcon,
  HOURS_WORKED: ClockIcon,
  FIVE_STAR_REVIEWS: StarIcon,
  TRIAL_CONVERSIONS: ArrowTrendingUpIcon,
};

function BadgeCard({ badge, earned = false }: { badge: EarnedBadge | AvailableBadge; earned?: boolean }) {
  const colors = parseColorScheme(badge.colorScheme);
  const earnedBadge = badge as EarnedBadge;

  // Get the icon component from the map, fallback to TrophyIcon
  const IconComponent = iconMap[badge.icon] || TrophyIcon;

  return (
    <div
      className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all hover:shadow-sm ${
        earned ? "bg-white" : "bg-neutral-50 opacity-50 hover:opacity-70"
      }`}
      style={{ borderColor: earned ? colors.borderColor : "#e5e7eb" }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-inner ${earned ? "" : "grayscale"}`}
          style={{ backgroundColor: earned ? colors.bgColor : "#f3f4f6" }}
        >
          <IconComponent className="w-7 h-7 sm:w-10 sm:h-10" style={{ color: earned ? colors.color : "#9ca3af" }} />
        </div>

        <h3 className="font-semibold text-neutral-900 mb-1 text-sm sm:text-base">{badge.title}</h3>
        <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2">{badge.description}</p>

        {earned && earnedBadge.earnedAt ? (
          <div className="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-success bg-success-light px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            <CheckCircleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Earned {new Date(earnedBadge.earnedAt).toLocaleDateString()}</span>
          </div>
        ) : (
          <div className="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neutral-400 bg-neutral-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            <LockClosedIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Locked</span>
          </div>
        )}
      </div>

      {earned && (
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.color || "#22c55e" }}
        >
          <CheckCircleIcon className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

function MilestoneProgressCard({ milestone }: { milestone: MilestoneProgress }) {
  const Icon = milestoneIcons[milestone.type] || FlagIcon;
  const nextThreshold = milestone.thresholds.find(t => !milestone.achieved.includes(t) && t > milestone.current);
  const lastAchieved = milestone.achieved.length > 0 ? Math.max(...milestone.achieved) : 0;
  const progressBase = lastAchieved;
  const progressTarget = nextThreshold || milestone.thresholds[milestone.thresholds.length - 1];
  const progressPercent = nextThreshold
    ? Math.min(((milestone.current - progressBase) / (progressTarget - progressBase)) * 100, 100)
    : 100;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="py-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-inner">
            <Icon className="w-7 h-7 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-neutral-900">{milestone.label}</h3>
              <span className="text-sm font-medium text-neutral-600">
                {milestone.current} {nextThreshold ? `/ ${nextThreshold}` : ""}
              </span>
            </div>
            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              {milestone.thresholds.map((threshold) => {
                const isAchieved = milestone.achieved.includes(threshold);
                return (
                  <div
                    key={threshold}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      isAchieved ? "bg-success-light text-success-dark" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {isAchieved && <CheckCircleIcon className="w-3 h-3" />}
                    {threshold}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AchievementsTab() {
  const { data: achievements, isLoading, error } = useAchievements();
  const [badgeFilter, setBadgeFilter] = useState<"all" | "earned" | "locked">("all");

  if (isLoading) {
    return (
      <>
        {/* Stats Summary Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
          <SkeletonStats />
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </>
    );
  }

  if (error || !achievements) {
    return (
      <Card className="border-error bg-error-light">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-error-dark">
            <ExclamationCircleIcon className="w-12 h-12" />
            <p className="text-lg font-medium">Failed to load achievements</p>
            <p className="text-sm text-error">Please try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { badges, streaks, milestones } = achievements;

  return (
    <>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-warning-light to-warning-light">
          <CardContent className="py-4 text-center">
            <TrophyIcon className="w-6 h-6 text-warning mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-warning-dark">{badges.totalEarned}</p>
            <p className="text-xs text-warning">Badges Earned</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-accent-orange-light to-error-light">
          <CardContent className="py-4 text-center">
            <FireIcon className="w-6 h-6 text-accent-orange mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-accent-orange">
              {streaks.find(s => s.type === "LOGIN")?.currentStreak || 0}
            </p>
            <p className="text-xs text-accent-orange">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-success-light to-success-light">
          <CardContent className="py-4 text-center">
            <FlagIcon className="w-6 h-6 text-success mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-success-dark">{milestones.achieved.length}</p>
            <p className="text-xs text-success">Milestones</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary-50 to-primary-100/50">
          <CardContent className="py-4 text-center">
            <SparklesIcon className="w-6 h-6 text-primary-600 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-primary-700">
              {streaks.find(s => s.type === "LOGIN")?.longestStreak || 0}
            </p>
            <p className="text-xs text-primary-600">Best Streak</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Badges */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-warning" />
                Badges
                <span className="text-sm text-neutral-500 font-normal ml-2">
                  {badges.totalEarned} / {badges.totalAvailable}
                </span>
              </h2>
              <div className="flex gap-1">
                {(["all", "earned", "locked"] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={badgeFilter === filter ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setBadgeFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const showEarned = badgeFilter === "all" || badgeFilter === "earned";
                const showLocked = badgeFilter === "all" || badgeFilter === "locked";
                const earnedEmpty = !showEarned || badges.earned.length === 0;
                const lockedEmpty = !showLocked || badges.available.length === 0;

                if (earnedEmpty && lockedEmpty) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <TrophyIcon className="w-10 h-10 text-neutral-300" />
                      </div>
                      <p className="text-neutral-500">
                        {badgeFilter === "earned" ? "No badges earned yet" :
                         badgeFilter === "locked" ? "No locked badges available" :
                         "No badges available yet"}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {showEarned &&
                      badges.earned.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} earned />
                      ))}
                    {showLocked &&
                      badges.available.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} earned={false} />
                      ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <FlagIcon className="w-5 h-5 text-success" />
                Milestone Progress
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestones.progress.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">No milestones to track yet</p>
                </div>
              ) : (
                milestones.progress.map((milestone) => (
                  <MilestoneProgressCard key={milestone.type} milestone={milestone} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Streaks & Recent Milestones */}
        <div className="space-y-6">
          {/* Streaks */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
            <CardHeader className="pb-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-accent-orange" />
                Your Streaks
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {streaks.length === 0 ? (
                <p className="text-center text-neutral-500 py-6">
                  Start your streak by logging in daily!
                </p>
              ) : (
                streaks.map((streak) => {
                  const config = streakConfig[streak.type] || {
                    label: streak.type,
                    icon: FireIcon,
                    color: "text-neutral-600",
                    bgColor: "bg-neutral-100",
                    gradient: "from-neutral-400 to-neutral-500",
                  };
                  const Icon = config.icon;

                  return (
                    <div
                      key={streak.type}
                      className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-accent-orange-light to-warning-light border border-accent-orange"
                    >
                      <div className="absolute -top-4 -right-4 w-20 h-20 bg-accent-orange-light/30 rounded-full" />
                      <div className="relative flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900">{config.label}</h3>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-3xl font-bold text-accent-orange">
                              {streak.currentStreak}
                            </span>
                            <span className="text-sm text-neutral-500">current</span>
                            <span className="text-sm text-neutral-400">
                              Best: <span className="font-medium text-neutral-600">{streak.longestStreak}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Milestones */}
          {milestones.achieved.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-primary-500" />
                  Recent Milestones
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.achieved.slice(0, 8).map((milestone) => {
                    const Icon = milestoneIcons[milestone.type] || FlagIcon;
                    const label = {
                      LESSONS_TAUGHT: "Lessons",
                      HOURS_WORKED: "Hours",
                      FIVE_STAR_REVIEWS: "5-Stars",
                      TRIAL_CONVERSIONS: "Conversions",
                    }[milestone.type] || milestone.type;

                    return (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-success-light to-success-light border border-success"
                      >
                        <div className="w-11 h-11 bg-success-light rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {milestone.value} {label}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {new Date(milestone.achievedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-success" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
