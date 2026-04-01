import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PuzzlePieceIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { OnboardingStatus } from "@prisma/client";
import { OnboardingPageHeader } from "@/components/admin/OnboardingPageHeader";

// Force dynamic rendering - database not available at build time
export const dynamic = "force-dynamic";

const statusLabels: Record<OnboardingStatus, string> = {
  PENDING: "Pending",
  WELCOME: "Welcome",
  VIDEOS_IN_PROGRESS: "Watching Videos",
  QUIZ_PENDING: "Quiz Pending",
  QUIZ_FAILED: "Quiz Failed",
  PROFILE_PENDING: "Profile Pending",
  W9_PENDING: "W-9 Pending",
  AWAITING_ORIENTATION: "Awaiting Orientation",
  ORIENTATION_SCHEDULED: "Orientation Scheduled",
  POST_ORIENTATION_TRAINING: "Training",
  SHADOW_LESSONS: "Shadow Lessons",
  COMPLETED: "Completed",
  ACTIVATED: "Activated",
  RETURNED: "Returned",
};

const statusColors: Record<OnboardingStatus, string> = {
  PENDING: "bg-neutral-100 text-neutral-700",
  WELCOME: "bg-info-light text-info-dark",
  VIDEOS_IN_PROGRESS: "bg-info-light text-info-dark",
  QUIZ_PENDING: "bg-warning-light text-warning-dark",
  QUIZ_FAILED: "bg-error-light text-error-dark",
  PROFILE_PENDING: "bg-warning-light text-warning-dark",
  W9_PENDING: "bg-warning-light text-warning-dark",
  AWAITING_ORIENTATION: "bg-primary-100 text-primary-700",
  ORIENTATION_SCHEDULED: "bg-primary-100 text-primary-700",
  POST_ORIENTATION_TRAINING: "bg-accent-navy-light text-accent-navy",
  SHADOW_LESSONS: "bg-accent-navy-light text-accent-navy",
  COMPLETED: "bg-success-light text-success-dark",
  ACTIVATED: "bg-success-light text-success-dark",
  RETURNED: "bg-error-light text-error-dark",
};

type OnboardingUser = Awaited<
  ReturnType<typeof prisma.onboardingProgress.findMany>
>[number] & {
  videoPartProgress: {
    videoPart: number;
    videoCompletedAt: Date | null;
    quizPassedAt: Date | null;
  }[];
  orientationSession: {
    title: string;
    scheduledAt: Date;
  } | null;
};

function getPhaseLabel(progress: OnboardingUser): string {
  const status = progress.status;

  if (status === "ACTIVATED") return "Active \u2713";
  if (status === "COMPLETED") return "Completed";
  if (status === "RETURNED") return "Returned";

  // Phase 1: Videos
  if (
    ["WELCOME", "VIDEOS_IN_PROGRESS", "QUIZ_PENDING", "QUIZ_FAILED"].includes(
      status
    )
  ) {
    const completed = progress.videoPartProgress.filter(
      (v) => v.videoCompletedAt && v.quizPassedAt
    ).length;
    if (status === "WELCOME") return "Welcome";
    return `Videos (${completed}/6)`;
  }

  // Phase 2: Profile & Docs
  if (["PROFILE_PENDING", "W9_PENDING"].includes(status)) {
    const profileDone = !!progress.profileCompletedAt;
    const w9Done = !!progress.w9CompletedAt;
    if (profileDone && !w9Done) return "W-9 Pending";
    return "Profile & Docs";
  }

  // Phase 3: Orientation
  if (
    ["AWAITING_ORIENTATION", "ORIENTATION_SCHEDULED"].includes(status)
  ) {
    return progress.orientationSession
      ? "Orientation Scheduled"
      : "Awaiting Orientation";
  }

  // Phase 4: Training
  if (status === "POST_ORIENTATION_TRAINING") {
    const count = [
      progress.demoMagicComplete,
      progress.chessConfidenceComplete,
      progress.teachingInSchoolsComplete,
      progress.chessableComplete,
    ].filter(Boolean).length;
    return `Training (${count}/4)`;
  }

  // Phase 5: Shadows
  if (status === "SHADOW_LESSONS") {
    const count = [
      progress.shadow1Complete,
      progress.shadow2Complete,
      progress.shadow3Complete,
    ].filter(Boolean).length;
    return `Shadows (${count}/3)`;
  }

  return statusLabels[status] || status;
}

export default async function AdminOnboardingPage() {
  // Get all onboarding users with their progress
  const onboardingUsers = await prisma.onboardingProgress.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      orientationSession: {
        select: {
          title: true,
          scheduledAt: true,
        },
      },
      videoPartProgress: {
        orderBy: { videoPart: "asc" },
        select: {
          videoPart: true,
          videoCompletedAt: true,
          quizPassedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const totalOnboarding = onboardingUsers.length;
  const inProgress = onboardingUsers.filter(
    (u) =>
      !["COMPLETED", "ACTIVATED", "RETURNED"].includes(u.status)
  ).length;
  const completed = onboardingUsers.filter(
    (u) => u.status === "COMPLETED"
  ).length;
  const needsAttention = onboardingUsers.filter(
    (u) => u.status === "RETURNED" || u.status === "QUIZ_FAILED"
  ).length;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stuckTutors = onboardingUsers.filter(
    (u) =>
      !["COMPLETED", "ACTIVATED", "RETURNED"].includes(u.status) &&
      u.updatedAt < sevenDaysAgo
  ).length;

  // Get upcoming orientation sessions
  const upcomingSessions = await prisma.orientationSession.findMany({
    where: {
      scheduledAt: { gt: new Date() },
      isActive: true,
    },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  // Calculate puzzle engagement stats
  const puzzleStats = await prisma.onboardingProgress.aggregate({
    _sum: {
      puzzlesSolved: true,
      puzzlesAttempted: true,
    },
    _avg: {
      puzzlesSolved: true,
    },
    _max: {
      puzzleBestStreak: true,
      puzzleCurrentRating: true,
    },
  });

  const usersWithPuzzles = onboardingUsers.filter(u => u.puzzlesAttempted > 0).length;
  const totalPuzzlesSolved = puzzleStats._sum.puzzlesSolved || 0;
  const totalPuzzlesAttempted = puzzleStats._sum.puzzlesAttempted || 0;
  const avgPuzzlesSolved = Math.round(puzzleStats._avg.puzzlesSolved || 0);
  const highestRating = puzzleStats._max.puzzleCurrentRating || 400;
  const bestStreak = puzzleStats._max.puzzleBestStreak || 0;

  return (
    <div className="p-6">
      <OnboardingPageHeader />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info-light flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-body-xs text-neutral-500">Total</p>
              <p className="text-heading-md text-neutral-900">{totalOnboarding}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning-light flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-body-xs text-neutral-500">In Progress</p>
              <p className="text-heading-md text-neutral-900">{inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success-light flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-body-xs text-neutral-500">Completed</p>
              <p className="text-heading-md text-neutral-900">{completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-error-light flex items-center justify-center">
              <ExclamationCircleIcon className="h-5 w-5 text-error" />
            </div>
            <div>
              <p className="text-body-xs text-neutral-500">Needs Attention</p>
              <p className="text-heading-md text-neutral-900">{needsAttention + stuckTutors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <PuzzlePieceIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-body-xs text-neutral-500">PuzzlePieceIcon Engagement</p>
              <p className="text-heading-md text-neutral-900">{usersWithPuzzles}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-heading-md text-neutral-900">Onboarding UsersIcon</h2>
          </div>
          <div className="divide-y divide-neutral-200">
            {onboardingUsers.length === 0 ? (
              <div className="p-8 text-center">
                <UsersIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No onboarding users yet</p>
              </div>
            ) : (
              onboardingUsers.map((progress) => (
                <Link
                  key={progress.id}
                  href={`/admin/onboarding/${progress.id}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {progress.user.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="text-body-md font-medium text-neutral-900">
                        {progress.user.name || "Unnamed User"}
                      </p>
                      <p className="text-body-sm text-neutral-500">
                        {progress.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-body-xs font-medium ${
                        statusColors[progress.status]
                      }`}
                    >
                      {getPhaseLabel(progress as OnboardingUser)}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-heading-md text-neutral-900">Upcoming Sessions</h2>
            <Link
              href="/admin/onboarding/sessions"
              className="text-body-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-neutral-200">
            {upcomingSessions.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDaysIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No upcoming sessions</p>
                <Link
                  href="/admin/onboarding/sessions"
                  className="text-primary-600 text-body-sm hover:text-primary-700 mt-2 inline-block"
                >
                  Create Session
                </Link>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="p-4">
                  <p className="text-body-md font-medium text-neutral-900">
                    {session.title}
                  </p>
                  <p className="text-body-sm text-neutral-500">
                    {new Date(session.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-body-xs text-neutral-400 mt-1">
                    {session._count.participants}/{session.maxParticipants} registered
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PuzzlePieceIcon Stats */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-heading-md text-neutral-900 flex items-center gap-2">
              <PuzzlePieceIcon className="h-5 w-5 text-primary-600" />
              Chess Puzzles
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-700">{totalPuzzlesSolved}</p>
                <p className="text-body-xs text-neutral-500">Puzzles Solved</p>
              </div>
              <div className="text-center p-3 bg-primary-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-700">{totalPuzzlesAttempted}</p>
                <p className="text-body-xs text-neutral-500">Total Attempts</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-500">UsersIcon Engaged</span>
                <span className="text-body-sm font-medium text-neutral-900">{usersWithPuzzles}/{totalOnboarding}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-500">Avg. Solved</span>
                <span className="text-body-sm font-medium text-neutral-900">{avgPuzzlesSolved} per user</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-500">Best Streak</span>
                <span className="text-body-sm font-medium text-warning">🔥 {bestStreak}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-500">Highest Rating</span>
                <span className="text-body-sm font-medium text-primary-600">{highestRating}</span>
              </div>
            </div>
            {totalPuzzlesAttempted > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body-xs text-neutral-500">Success Rate</span>
                  <span className="text-body-xs font-medium text-success">
                    {Math.round((totalPuzzlesSolved / totalPuzzlesAttempted) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${(totalPuzzlesSolved / totalPuzzlesAttempted) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
