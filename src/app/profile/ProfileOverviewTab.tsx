"use client";

import Link from "next/link";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BoltIcon,
  BookOpenIcon,
  ClockIcon,
  FireIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { parseBadgeColors } from "@/hooks/useBadges";
import type { ProfileOverviewData } from "@/hooks/useProfileOverview";

export function ProfileOverviewTab({ data }: { data: ProfileOverviewData }) {
  const bestStreak = Math.max(
    data.streaks.login.current,
    data.streaks.lesson.current
  );

  return (
    <div>
      {/* Stats Hero */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={<BookOpenIcon className="w-5 h-5 text-info" />}
          value={String(data.totalLessons)}
          label="Total Lessons"
        />
        <StatCard
          icon={<ClockIcon className="w-5 h-5 text-info" />}
          value={data.totalHours.toFixed(1)}
          label="Hours Taught"
        />
        <StatCard
          icon={<StarIcon className="w-5 h-5 text-warning fill-current" />}
          value={data.averageRating?.toFixed(1) || "\u2014"}
          label="Avg Rating"
        />
        <StatCard
          icon={<BoltIcon className="w-5 h-5 text-primary-500" />}
          value={String(data.points.total)}
          label={`#${data.points.rank}`}
        />
        <StatCard
          icon={<TrophyIcon className="w-5 h-5 text-success" />}
          value={String(data.badges.total)}
          label="Badges"
        />
        <StatCard
          icon={<FireIcon className="w-5 h-5 text-accent-orange" />}
          value={String(bestStreak)}
          label="Streak"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Training Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-accent-navy" />
                Training Progress
              </h3>
              <ViewAllLink href="/training" />
            </div>
            <div className="p-4">
              {data.training.enrolled === 0 ? (
                <EmptyState
                  icon={
                    <AcademicCapIcon className="w-10 h-10 text-neutral-300" />
                  }
                  message="Start your first course"
                />
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-light text-info-dark">
                      {data.training.enrolled} enrolled
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning-dark">
                      {data.training.inProgress} in progress
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-light text-success-dark">
                      {data.training.completed} completed
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-primary-500 rounded-full h-2 transition-all"
                      style={{
                        width: `${Math.min(data.training.overallProgress, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-neutral-500">
                    {data.training.overallProgress}% complete
                  </p>
                </>
              )}
            </div>
          </div>

          {/* My Classes */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-info" />
                My Classes
              </h3>
              <ViewAllLink href="/classes" />
            </div>
            <div className="p-4">
              {data.classes.list.length === 0 ? (
                <EmptyState
                  icon={<UsersIcon className="w-10 h-10 text-neutral-300" />}
                  message="No classes yet"
                />
              ) : (
                <>
                  <p className="text-sm text-neutral-500 mb-3">
                    {data.classes.active} active classes &middot;{" "}
                    {data.classes.totalStudents} students
                  </p>
                  <div className="space-y-2">
                    {data.classes.list.slice(0, 3).map((cls) => (
                      <Link key={cls.id} href={`/classes/${cls.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${cls.color || "#6366f1"}15`,
                            }}
                          >
                            <UsersIcon
                              className="w-5 h-5"
                              style={{ color: cls.color || "#6366f1" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 truncate">
                              {cls.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {cls.studentCount} students &middot;{" "}
                              {cls.sessionCount} sessions
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chess Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <PuzzlePieceIcon className="w-5 h-5 text-success" />
                Chess Activity
              </h3>
              <div className="flex items-center gap-2">
                <ViewAllLink href="/puzzles" label="Puzzles" />
                <ViewAllLink href="/learn" label="Learn" />
              </div>
            </div>
            <div className="p-4">
              {data.chess.puzzlesSolved === 0 &&
              data.chess.lessonsCompleted === 0 &&
              !data.chess.puzzleRating ? (
                <EmptyState
                  icon={<PuzzlePieceIcon className="w-10 h-10 text-neutral-300" />}
                  message="Start solving puzzles"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xl font-bold text-neutral-900">
                      {data.chess.puzzleRating || "Unrated"}
                    </p>
                    <p className="text-xs text-neutral-500">PuzzlePieceIcon Rating</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xl font-bold text-neutral-900">
                      {data.chess.puzzlesSolved}
                    </p>
                    <p className="text-xs text-neutral-500">Puzzles Solved</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xl font-bold text-neutral-900">
                      {data.chess.lessonsCompleted}/{data.chess.lessonsTotal}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Lessons Completed
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xl font-bold text-neutral-900">
                      {data.chess.puzzleStreak}
                    </p>
                    <p className="text-xs text-neutral-500">PuzzlePieceIcon Streak</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent Badges */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-primary-500" />
                Recent Badges
              </h3>
              <ViewAllLink href="/growth" />
            </div>
            <div className="p-4">
              {data.badges.recent.length === 0 ? (
                <EmptyState
                  icon={<TrophyIcon className="w-10 h-10 text-neutral-300" />}
                  message="Earn badges by completing training"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {data.badges.recent.map((badge) => {
                    const colors = parseBadgeColors(badge.colorScheme);
                    return (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-2 shadow-sm"
                          style={{ backgroundColor: colors.bgColor }}
                        >
                          {badge.icon}
                        </div>
                        <p className="text-xs font-medium text-neutral-700 line-clamp-2">
                          {badge.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-success" />
                Certifications
              </h3>
            </div>
            <div className="p-4">
              {(() => {
                const certPills: { label: string; className: string }[] = [];
                if (data.isSchoolCertified) {
                  certPills.push({
                    label: "School Certified",
                    className: "bg-info-light text-info-dark",
                  });
                }
                if (data.isBqCertified) {
                  certPills.push({
                    label: "BQ Certified",
                    className: "bg-primary-100 text-primary-700",
                  });
                }
                if (data.isPlaygroupCertified) {
                  certPills.push({
                    label: "Playgroup Certified",
                    className: "bg-success-light text-success-dark",
                  });
                }
                data.certifications
                  .filter((c) => c.status === "COMPLETED")
                  .forEach((c) => {
                    certPills.push({
                      label: c.type,
                      className: "bg-accent-navy-light text-accent-navy",
                    });
                  });

                if (certPills.length === 0) {
                  return (
                    <EmptyState
                      icon={
                        <ShieldCheckIcon className="w-10 h-10 text-neutral-300" />
                      }
                      message="No certifications yet"
                    />
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2">
                    {certPills.map((pill) => (
                      <span
                        key={pill.label}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${pill.className}`}
                      >
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        {pill.label}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Active Streaks */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-accent-orange via-error to-accent-pink" />
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-accent-orange" />
                Streaks
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-accent-orange-light to-warning-light rounded-xl border border-accent-orange">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent-orange-light/30 rounded-full" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-orange to-error rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm shadow-accent-orange-light">
                      <BoltIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-accent-orange">
                      {data.streaks.login.current}
                    </p>
                    <p className="text-xs font-medium text-neutral-600">
                      Login Streak
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Best: {data.streaks.login.longest}
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-warning-light to-warning-light rounded-xl border border-warning">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-warning-light/30 rounded-full" />
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-warning to-accent-orange rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm shadow-warning-light">
                      <BookOpenIcon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-warning">
                      {data.streaks.lesson.current}
                    </p>
                    <p className="text-xs font-medium text-neutral-600">
                      Lesson Streak
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Best: {data.streaks.lesson.longest}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function ViewAllLink({
  href,
  label = "View all",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
    >
      {label} <ArrowRightIcon className="w-3 h-3" />
    </Link>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center py-6">
      {icon}
      <p className="text-sm text-neutral-400 mt-2">{message}</p>
    </div>
  );
}
