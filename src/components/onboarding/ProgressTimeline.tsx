"use client";

import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UsersIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingProgress, OrientationSession } from "@prisma/client";

interface ProgressWithRelations extends OnboardingProgress {
  orientationSession: OrientationSession | null;
}

interface ProgressTimelineProps {
  progress: ProgressWithRelations;
  userName: string;
  totalVideos: number;
}

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completedAt: Date | null;
  href?: string;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProgressTimeline({
  progress,
  userName,
  totalVideos,
}: ProgressTimelineProps) {
  const videoProgress = progress.videoProgress as Array<{
    videoId: string;
    percentWatched: number;
    completedAt?: string;
  }>;
  const completedVideos = videoProgress.filter((v) => v.percentWatched >= 90).length;

  const trainingSessions = progress.trainingSessions as Array<{
    sessionNumber: number;
    completedAt: string;
  }>;
  const completedTrainingSessions = trainingSessions.length;

  const shadowLessons = progress.shadowLessons as Array<{
    lessonNumber: number;
    completedAt: string;
  }>;
  const completedShadowLessons = shadowLessons.length;

  const steps: TimelineStep[] = [
    {
      id: "welcome",
      title: "Welcome",
      description: "Started onboarding journey",
      icon: SparklesIcon,
      completedAt: progress.welcomeCompletedAt || progress.createdAt,
    },
    {
      id: "videos",
      title: "Training Videos",
      description: `${completedVideos}/${totalVideos} videos completed`,
      icon: PlayCircleIcon,
      completedAt: progress.videosCompletedAt,
      href: "/onboarding/videos",
    },
    {
      id: "quiz",
      title: "Knowledge Quiz",
      description: progress.quizPassedAt
        ? `Passed with ${progress.quizScore}%`
        : progress.quizAttempts > 0
        ? `${progress.quizAttempts} attempts, best: ${progress.quizScore}%`
        : "Test your knowledge",
      icon: QuestionMarkCircleIcon,
      completedAt: progress.quizPassedAt,
      href: "/onboarding/quiz",
    },
    {
      id: "profile",
      title: "Profile Setup",
      description: "Professional profile information",
      icon: UserIcon,
      completedAt: progress.profileCompletedAt,
      href: "/onboarding/profile",
    },
    {
      id: "w9",
      title: "W-9 Form",
      description: "Tax information submitted",
      icon: DocumentTextIcon,
      completedAt: progress.w9CompletedAt,
      href: "/onboarding/documents",
    },
    {
      id: "orientation",
      title: "Orientation Session",
      description: progress.orientationAttendedAt
        ? "Attended orientation"
        : progress.orientationSession
        ? `Registered for ${formatDate(progress.orientationSession.scheduledAt)}`
        : "Register for session",
      icon: CalendarDaysIcon,
      completedAt: progress.orientationAttendedAt,
      href: "/onboarding/orientation",
    },
    {
      id: "training",
      title: "Training Sessions",
      description: `${completedTrainingSessions}/3 sessions with Jessica`,
      icon: AcademicCapIcon,
      completedAt: progress.trainingCompletedAt,
    },
    {
      id: "shadow",
      title: "Shadow Lessons",
      description: `${completedShadowLessons}/3 lessons completed`,
      icon: UsersIcon,
      completedAt: progress.shadowCompletedAt,
    },
  ];

  // Find current step index
  const currentStepIndex = steps.findIndex((step) => !step.completedAt);

  const completedSteps = steps.filter((s) => s.completedAt).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>
        <h1 className="text-heading-lg text-neutral-900">Your Progress</h1>
        <p className="text-body-md text-neutral-600">
          Track your onboarding journey, {userName}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-md text-neutral-900">Overall Progress</h2>
          <span className="text-heading-sm text-primary-600">
            {completedSteps} of {steps.length} steps
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <div
            className="bg-primary-600 rounded-full h-3 transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timeline */}
        <div className="lg:col-span-2">
          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-6">Timeline</h2>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isComplete = !!step.completedAt;
              const isCurrent = index === currentStepIndex;
              const isPast = index < currentStepIndex;

              return (
                <div key={step.id} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 h-10 w-10 rounded-lg flex items-center justify-center ${
                      isComplete
                        ? "bg-success-light"
                        : isCurrent
                        ? "bg-primary-100 ring-4 ring-primary-50"
                        : "bg-neutral-100"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircleIcon className="h-5 w-5 text-success" />
                    ) : isCurrent ? (
                      <Icon className="h-5 w-5 text-primary-600" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-neutral-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3
                          className={`text-body-lg font-semibold ${
                            isComplete
                              ? "text-success-dark"
                              : isCurrent
                              ? "text-primary-700"
                              : "text-neutral-500"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={`text-body-sm ${
                            isComplete || isCurrent
                              ? "text-neutral-600"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.description}
                        </p>
                        {isComplete && step.completedAt && (
                          <p className="text-body-xs text-neutral-500 mt-1">
                            Completed {formatDate(step.completedAt)}
                          </p>
                        )}
                      </div>

                      {step.href && (isComplete || isCurrent) && (
                        <Link
                          href={step.href}
                          className={`text-body-sm font-medium ${
                            isComplete
                              ? "text-neutral-500 hover:text-neutral-700"
                              : "text-primary-600 hover:text-primary-700"
                          }`}
                        >
                          {isComplete ? "Review" : "Continue"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
          </div>

          {/* Completion Message */}
          {progress.status === "COMPLETED" && (
            <div className="bg-success-light border border-success rounded-xl p-6 mt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-heading-md text-success-dark">
                    Onboarding Complete!
                  </h3>
                  <p className="text-body-md text-success">
                    An admin will review and activate your account soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post-Orientation Info */}
          {progress.orientationAttendedAt && !progress.trainingCompletedAt && (
            <div className="bg-info-light border border-info rounded-xl p-6 mt-6">
              <h3 className="text-heading-sm text-info-dark mb-2">Next Steps</h3>
              <p className="text-body-sm text-info-dark mb-4">
                You&apos;re almost there! Complete your training sessions with Jessica
                and shadow lessons to finish onboarding.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-body-md font-semibold text-neutral-900 mb-1">
                    Training Sessions
                  </h4>
                  <p className="text-body-sm text-neutral-600">
                    {completedTrainingSessions}/3 completed
                  </p>
                  <p className="text-body-xs text-neutral-500 mt-2">
                    Scheduled by admin via Zoom
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="text-body-md font-semibold text-neutral-900 mb-1">
                    Shadow Lessons
                  </h4>
                  <p className="text-body-sm text-neutral-600">
                    {completedShadowLessons}/3 completed
                  </p>
                  <p className="text-body-xs text-neutral-500 mt-2">
                    Observe experienced tutors
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
            <h3 className="text-heading-sm text-neutral-900 mb-4">
              Progress Summary
            </h3>
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-neutral-200">
                <div className="text-4xl font-bold text-primary-600 mb-1">
                  {progressPercent}%
                </div>
                <p className="text-body-sm text-neutral-500">Complete</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-body-sm text-neutral-600">Steps done</span>
                <span className="text-body-md font-semibold text-neutral-900">
                  {completedSteps}/{steps.length}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <span className="text-body-sm text-neutral-600">Videos</span>
                <span className="text-body-md font-semibold text-neutral-900">
                  {completedVideos}/{totalVideos}
                </span>
              </div>
              {progress.quizPassedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-neutral-600">Quiz score</span>
                  <span className="text-body-md font-semibold text-success">
                    {progress.quizScore}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {currentStepIndex >= 0 && currentStepIndex < steps.length && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-primary-800 mb-2">
                Current Step
              </h4>
              <p className="text-body-sm text-primary-700 mb-3">
                {steps[currentStepIndex].title}
              </p>
              {steps[currentStepIndex].href && (
                <Link
                  href={steps[currentStepIndex].href}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-body-sm font-medium"
                >
                  Continue
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {progress.status !== "COMPLETED" && (
            <div className="bg-warning-light border border-warning rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-warning-dark mb-2">
                Remaining Steps
              </h4>
              <ul className="text-body-sm text-warning-dark space-y-1">
                {steps.filter((s) => !s.completedAt).map((step) => (
                  <li key={step.id}>• {step.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
