"use client";

import Link from "next/link";
import {
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";

interface TrainingTabProps {
  tutor: AdminTutorOverview;
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  BEGINNER: { bg: "bg-success-light", text: "text-success-dark" },
  INTERMEDIATE: { bg: "bg-info-light", text: "text-info-dark" },
  ADVANCED: { bg: "bg-primary-100", text: "text-primary-700" },
  EXPERT: { bg: "bg-error-light", text: "text-error-dark" },
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-warning-light", text: "text-warning-dark", label: "In Progress" },
  COMPLETED: { bg: "bg-success-light", text: "text-success-dark", label: "Completed" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof AcademicCapIcon;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-info-light", text: "text-info" },
    amber: { bg: "bg-warning-light", text: "text-warning" },
    green: { bg: "bg-success-light", text: "text-success" },
    purple: { bg: "bg-primary-50", text: "text-primary-600" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-col items-center text-center">
      <div className={`h-10 w-10 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <p className="text-xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export default function TrainingTab({ tutor }: TrainingTabProps) {
  const { training, chess } = tutor;

  return (
    <div className="space-y-4">
      {/* Training Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AcademicCapIcon} label="Enrolled" value={training.enrolled} color="blue" />
        <StatCard icon={ClockIcon} label="In Progress" value={training.inProgress} color="amber" />
        <StatCard icon={CheckCircleIcon} label="Completed" value={training.completed} color="green" />
        <StatCard
          icon={ChartBarIcon}
          label="Overall Progress"
          value={`${training.overallProgress}%`}
          color="purple"
        />
      </div>

      {/* Course List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-2 p-4 pb-0">
          <AcademicCapIcon className="h-5 w-5 text-neutral-700" />
          <h3 className="text-sm font-semibold text-neutral-900">Training Courses</h3>
        </div>
        <div className="p-4">
          {training.courses.length > 0 ? (
            <div className="space-y-4">
              {training.courses.map((course) => {
                const diff = difficultyColors[course.difficulty] || difficultyColors.BEGINNER;
                const stat = statusColors[course.status] || statusColors.NOT_STARTED;

                return (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors"
                  >
                    {/* Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/admin/training/${course.id}`}
                          className="font-medium text-neutral-900 hover:text-primary-600 transition-colors truncate"
                        >
                          {course.title}
                        </Link>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium ${diff.bg} ${diff.text} flex-shrink-0`}
                        >
                          {course.difficulty.charAt(0) + course.difficulty.slice(1).toLowerCase()}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-neutral-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(course.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-500 flex-shrink-0 w-10 text-right">
                          {course.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Status + completion date */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium ${stat.bg} ${stat.text}`}
                      >
                        {stat.label}
                      </span>
                      {course.status === "COMPLETED" && course.completedAt && (
                        <span className="text-xs text-neutral-400">
                          {new Date(course.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-neutral-500 font-medium">No training courses enrolled</p>
            </div>
          )}
        </div>
      </div>

      {/* Chess Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-2 p-4 pb-0">
          <PuzzlePieceIcon className="h-5 w-5 text-neutral-700" />
          <h3 className="text-sm font-semibold text-neutral-900">Chess Activity</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Profile Chess Data */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                Profile
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-sm text-neutral-500">Chess Level</span>
                  <span className="font-medium text-neutral-900">
                    {tutor.chessLevel || "\u2014"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-sm text-neutral-500">Chess Rating</span>
                  <span className="font-medium text-neutral-900">
                    {tutor.chessRating || "\u2014"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-sm text-neutral-500">Noctie Rating</span>
                  <span className="font-medium text-neutral-900">
                    {tutor.noctieRating || "\u2014"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-neutral-500">Chessable Username</span>
                  <span className="font-medium text-neutral-900">
                    {tutor.chessableUsername ? (
                      <span className="flex items-center gap-1">
                        {tutor.chessableUsername}
                        <a
                          href={`https://www.chessable.com/user/${tutor.chessableUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600"
                        >
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </a>
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Activity Stats */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                Activity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-neutral-900">
                    {chess.puzzleRating || "Unrated"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">Puzzle Rating</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-neutral-900">{chess.puzzlesSolved}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Puzzles Solved</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-neutral-900">
                    {chess.lessonsCompleted}/{chess.lessonsTotal}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">Chess Lessons</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-neutral-900">{chess.puzzleStreak}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Puzzle Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
