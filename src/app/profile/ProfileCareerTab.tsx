"use client";

import Link from "next/link";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  MinusIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { ProfileOverviewData } from "@/hooks/useProfileOverview";

const CERT_TYPES = [
  { key: "SCHOOL_CERTIFIED", label: "School Certified", color: "blue" },
  { key: "BQ_CERTIFIED", label: "BQ Certified", color: "purple" },
  { key: "PLAYGROUP_CERTIFIED", label: "Playgroup Certified", color: "green" },
  { key: "CHESSABLE_COMPLETED", label: "Chessable Completed", color: "amber" },
  { key: "BACKGROUND_CHECK", label: "Background Check", color: "sky" },
  { key: "ADVANCED_CHESS", label: "Advanced Chess", color: "indigo" },
  { key: "LEAD_TUTOR", label: "Lead Tutor", color: "rose" },
] as const;

const FLAG_MAP: Record<string, keyof ProfileOverviewData> = {
  SCHOOL_CERTIFIED: "isSchoolCertified",
  BQ_CERTIFIED: "isBqCertified",
  PLAYGROUP_CERTIFIED: "isPlaygroupCertified",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-success-light text-success-dark",
  INTERMEDIATE: "bg-warning-light text-warning-dark",
  ADVANCED: "bg-error-light text-error-dark",
};

const CERT_BORDER_COLORS: Record<string, string> = {
  blue: "border-l-info",
  purple: "border-l-primary-500",
  green: "border-l-success",
  amber: "border-l-warning",
  sky: "border-l-info",
  indigo: "border-l-accent-navy",
  rose: "border-l-error",
};

const CERT_ICON_COLORS: Record<string, string> = {
  blue: "text-info",
  purple: "text-primary-500",
  green: "text-success",
  amber: "text-warning",
  sky: "text-info",
  indigo: "text-accent-navy",
  rose: "text-error",
};

export function ProfileCareerTab({ data }: { data: ProfileOverviewData }) {
  return (
    <div className="space-y-6">
      {/* Certifications */}
      <CertificationsSection data={data} />

      {/* Training Progress */}
      <TrainingProgressSection data={data} />

      {/* Chess Skills */}
      <ChessSkillsSection data={data} />

      {/* Classes */}
      <ClassesSection data={data} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

function CertificationsSection({ data }: { data: ProfileOverviewData }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
          Certifications
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CERT_TYPES.map((ct) => {
          const cert = data.certifications.find((c) => c.type === ct.key);
          const flagKey = FLAG_MAP[ct.key] as
            | "isSchoolCertified"
            | "isBqCertified"
            | "isPlaygroupCertified"
            | undefined;
          const hasFlag = flagKey ? !!data[flagKey] : false;

          const isCompleted =
            cert?.status === "COMPLETED" ||
            cert?.status === "ACTIVE" ||
            hasFlag;
          const isInProgress =
            !isCompleted && cert?.status === "IN_PROGRESS";
          const earnedDate = cert?.earnedAt
            ? new Date(cert.earnedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : null;

          return (
            <div
              key={ct.key}
              className={`rounded-lg border p-3 flex items-start gap-3 ${
                isCompleted
                  ? `border-l-4 ${CERT_BORDER_COLORS[ct.color]} border-neutral-200 bg-white`
                  : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <TrophyIcon
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isCompleted
                    ? CERT_ICON_COLORS[ct.color]
                    : "text-neutral-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    isCompleted ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {ct.label}
                </p>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs text-success mt-1">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Completed{earnedDate ? ` - ${earnedDate}` : ""}
                  </span>
                )}
                {isInProgress && (
                  <span className="inline-flex items-center gap-1 text-xs text-warning mt-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    In Progress
                  </span>
                )}
                {!isCompleted && !isInProgress && (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <MinusIcon className="w-3.5 h-3.5" />
                    Not Started
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Training Progress
// ---------------------------------------------------------------------------

function TrainingProgressSection({ data }: { data: ProfileOverviewData }) {
  const sortedCourses = [...data.training.courses].sort((a, b) => {
    const order: Record<string, number> = {
      IN_PROGRESS: 0,
      ENROLLED: 1,
      COMPLETED: 2,
    };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <AcademicCapIcon className="w-5 h-5 text-primary-600" />
          Training Progress
        </h3>
        <Link
          href="/training"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          Browse Training
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        {data.training.enrolled} enrolled &middot; {data.training.inProgress} in
        progress &middot; {data.training.completed} completed
      </p>

      {sortedCourses.length > 0 ? (
        <div className="space-y-3">
          {sortedCourses.map((course) => (
            <div
              key={course.id}
              className="border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-neutral-900 truncate">
                    {course.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      DIFFICULTY_COLORS[course.difficulty] ??
                      "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {course.difficulty}
                  </span>
                </div>
                <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                  {course.status === "COMPLETED" && course.completedAt
                    ? `Completed ${new Date(course.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : `${Math.round(course.progress)}%`}
                </span>
              </div>

              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    course.status === "COMPLETED"
                      ? "bg-success"
                      : "bg-primary-500"
                  }`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <AcademicCapIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            You haven&apos;t enrolled in any courses yet
          </p>
          <Link
            href="/training"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
          >
            Browse available courses
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chess Skills
// ---------------------------------------------------------------------------

function ChessSkillsSection({ data }: { data: ProfileOverviewData }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <TrophyIcon className="w-5 h-5 text-primary-600" />
          Chess Skills
        </h3>
        <div className="flex items-center gap-3">
          <Link
            href="/puzzles"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <PuzzlePieceIcon className="w-4 h-4" />
            Puzzles
          </Link>
          <Link
            href="/learn"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <BookOpenIcon className="w-4 h-4" />
            Learn
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Skills */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">
            Profile Skills
          </h4>
          <div className="space-y-3">
            <SkillRow
              label="Chess Level"
              value={data.chessSkills.level ?? "Not set"}
            />
            <SkillRow
              label="Chess Rating"
              value={data.chessSkills.rating ?? "Not set"}
            />
            <SkillRow
              label="Noctie Rating"
              value={data.chessSkills.noctieRating ?? "Not set"}
            />
            {data.chessSkills.chessableProgress != null && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-500">Chessable Progress</span>
                  <span className="font-medium text-neutral-900">
                    {Math.round(data.chessSkills.chessableProgress)}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{
                      width: `${data.chessSkills.chessableProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {data.chessSkills.chessableUsername && (
              <SkillRow
                label="Chessable Username"
                value={data.chessSkills.chessableUsername}
              />
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-3">
            Activity Stats
          </h4>
          <div className="space-y-3">
            <SkillRow
              label="PuzzlePieceIcon Rating"
              value={
                data.chess.puzzleRating != null
                  ? String(data.chess.puzzleRating)
                  : "Unrated"
              }
            />
            <SkillRow
              label="Puzzles Solved"
              value={String(data.chess.puzzlesSolved)}
            />
            <SkillRow
              label="PuzzlePieceIcon Streak"
              value={String(data.chess.puzzleStreak)}
            />
            <SkillRow
              label="Lessons Completed"
              value={`${data.chess.lessonsCompleted}/${data.chess.lessonsTotal}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillRow({ label, value }: { label: string; value: string }) {
  const isMissing = value === "Not set" || value === "Unrated";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span
        className={`font-medium ${isMissing ? "text-neutral-400" : "text-neutral-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

function ClassesSection({ data }: { data: ProfileOverviewData }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <UsersIcon className="w-5 h-5 text-primary-600" />
          My Classes
        </h3>
        <Link
          href="/classes"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View all
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        {data.classes.active} active classes &middot;{" "}
        {data.classes.totalStudents} students
      </p>

      {data.classes.list.length > 0 ? (
        <div className="space-y-2">
          {data.classes.list.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-3 border border-neutral-200 rounded-lg p-3"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cls.color ?? "#a3a3a3" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {cls.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {cls.studentCount} student{cls.studentCount !== 1 ? "s" : ""}{" "}
                  &middot; {cls.sessionCount} session
                  {cls.sessionCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <UsersIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No classes yet</p>
        </div>
      )}
    </div>
  );
}
