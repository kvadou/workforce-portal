"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  CubeIcon,
  FunnelIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  StarIcon,
  UsersIcon,
  WrenchIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  useLiveSessions,
  useRegisterForSession,
  useUnregisterFromSession,
  type LiveSession,
} from "@/hooks/useLiveSessions";
import type { LiveSessionCategory } from "@prisma/client";

const CATEGORY_INFO: Record<
  LiveSessionCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  TRAINING: {
    label: "Training",
    icon: <BookOpenIcon className="w-4 h-4" />,
    color: "bg-primary-100 text-primary-700",
  },
  Q_AND_A: {
    label: "Q&A",
    icon: <QuestionMarkCircleIcon className="w-4 h-4" />,
    color: "bg-info-light text-info-dark",
  },
  WORKSHOP: {
    label: "Workshop",
    icon: <WrenchIcon className="w-4 h-4" />,
    color: "bg-warning-light text-warning-dark",
  },
  OFFICE_HOURS: {
    label: "Office Hours",
    icon: <CubeIcon className="w-4 h-4" />,
    color: "bg-success-light text-success-dark",
  },
  SPECIAL_EVENT: {
    label: "Special Event",
    icon: <StarIcon className="w-4 h-4" />,
    color: "bg-error-light text-error-dark",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isSessionSoon(scheduledAt: string): boolean {
  const sessionTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return sessionTime - now <= oneHour && sessionTime > now;
}

function SessionCard({ session }: { session: LiveSession }) {
  const register = useRegisterForSession();
  const unregister = useUnregisterFromSession();
  const categoryInfo = CATEGORY_INFO[session.category];
  const isSoon = isSessionSoon(session.scheduledAt);
  const isLoading = register.isPending || unregister.isPending;

  const handleRegister = async () => {
    try {
      await register.mutateAsync(session.id);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleUnregister = async () => {
    try {
      await unregister.mutateAsync(session.id);
    } catch (error) {
      console.error("Unregistration failed:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-primary-100 overflow-hidden hover:shadow-card-hover transition-shadow">
      {/* Category banner */}
      <div
        className={`px-4 py-2 flex items-center gap-2 ${categoryInfo.color}`}
      >
        {categoryInfo.icon}
        <span className="text-sm font-medium">{categoryInfo.label}</span>
        {isSoon && (
          <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded-full font-medium">
            Starting Soon!
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {session.title}
        </h3>
        {session.description && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <CalendarDaysIcon className="w-4 h-4 text-primary-500" />
            <span>{formatDate(session.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <ClockIcon className="w-4 h-4 text-primary-500" />
            <span>
              {formatTime(session.scheduledAt)} ({session.duration} min)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <UsersIcon className="w-4 h-4 text-primary-500" />
            <span>
              {session.spotsRemaining > 0 ? (
                <>
                  {session.spotsRemaining} of {session.maxParticipants} spots
                  remaining
                </>
              ) : (
                <span className="text-error font-medium">Session Full</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <PlayIcon className="w-4 h-4 text-primary-500" />
            <span>Hosted by {session.hostName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {session.isRegistered ? (
            <>
              <button
                onClick={handleUnregister}
                disabled={isLoading || isSoon}
                className="flex-1 px-4 py-2 text-sm font-medium text-error bg-error-light rounded-lg hover:bg-error-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  <>
                    <XCircleIcon className="w-4 h-4 inline mr-1" />
                    Unregister
                  </>
                )}
              </button>
              {session.zoomJoinUrl && (
                <a
                  href={session.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors text-center ${
                    isSoon
                      ? "bg-success hover:bg-success-dark animate-pulse"
                      : "bg-primary-600 hover:bg-primary-700"
                  }`}
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 inline mr-1" />
                  Join Session
                </a>
              )}
            </>
          ) : (
            <button
              onClick={handleRegister}
              disabled={isLoading || session.spotsRemaining === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  Register
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveSessionsClient() {
  const [categoryFilter, setCategoryFilter] =
    useState<LiveSessionCategory | null>(null);
  const [showPast, setShowPast] = useState(false);

  const { data, isLoading, error } = useLiveSessions({
    category: categoryFilter ?? undefined,
    includePast: showPast,
  });

  const sessions = data?.sessions ?? [];
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) >= new Date()
  );
  const pastSessions = sessions.filter(
    (s) => new Date(s.scheduledAt) < new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            Live Sessions
          </h1>
          <p className="text-neutral-600">
            Join live training sessions, Q&As, and workshops with your team.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card border border-primary-100 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <FunnelIcon className="w-4 h-4" />
              <span>FunnelIcon:</span>
            </div>

            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                !categoryFilter
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All
            </button>

            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <button
                key={key}
                onClick={() =>
                  setCategoryFilter(key as LiveSessionCategory)
                }
                className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                  categoryFilter === key
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {info.icon}
                {info.label}
              </button>
            ))}

            <div className="w-full sm:w-auto sm:ml-auto">
              <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPast}
                  onChange={(e) => setShowPast(e.target.checked)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                Show past sessions
              </label>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-error-light border border-error rounded-xl p-6 text-center">
            <p className="text-error-dark">Failed to load sessions</p>
          </div>
        )}

        {/* Sessions Grid */}
        {!isLoading && !error && (
          <>
            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 ? (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Upcoming Sessions
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card border border-primary-100 p-12 text-center mb-12">
                <PlayIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No Upcoming Sessions
                </h3>
                <p className="text-neutral-600">
                  Check back soon for new live sessions!
                </p>
              </div>
            )}

            {/* Past Sessions */}
            {showPast && pastSessions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                  Past Sessions
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden"
                    >
                      <div className="px-4 py-2 bg-neutral-100 flex items-center gap-2 text-neutral-600">
                        {CATEGORY_INFO[session.category].icon}
                        <span className="text-sm font-medium">
                          {CATEGORY_INFO[session.category].label}
                        </span>
                        <span className="ml-auto text-xs bg-neutral-200 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                          {session.title}
                        </h3>
                        <div className="space-y-2 text-sm text-neutral-500">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {formatDate(session.scheduledAt)}
                          </div>
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4" />
                            {session.participantCount} attended
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
