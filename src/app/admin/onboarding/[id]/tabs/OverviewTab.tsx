"use client";

import {
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingDetail } from "@/hooks/useOnboardingAdmin";
import { SelfServiceStep } from "../components";

export function OverviewTab({ data }: { data: OnboardingDetail }) {
  const videoProgress = (data.videoProgress || []) as Array<{
    videoId: string;
    percentWatched: number;
  }>;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-body-xs text-neutral-500 mb-1">Quiz Score</p>
          <p className="text-heading-md text-neutral-900">
            {data.quizScore != null ? `${data.quizScore}%` : "Not taken"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-body-xs text-neutral-500 mb-1">Videos Watched</p>
          <p className="text-heading-md text-neutral-900">
            {videoProgress.filter((v) => v.percentWatched >= 90).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-body-xs text-neutral-500 mb-1">Orientation</p>
          <p className="text-heading-md text-neutral-900">
            {data.orientationAttendedAt
              ? new Date(data.orientationAttendedAt).toLocaleDateString()
              : data.orientationSession
              ? "Scheduled"
              : "Not scheduled"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-body-xs text-neutral-500 mb-1">Cohort</p>
          <p className="text-heading-md text-neutral-900">
            {data.cohortMembership?.cohortName || "None"}
          </p>
        </div>
      </div>

      {/* Onboarding Journey */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-heading-md text-neutral-900 mb-3">
          Onboarding Journey
        </h2>
        <div className="space-y-3">
          <SelfServiceStep
            label="Welcome"
            icon={UserIcon}
            completed={!!data.welcomeCompletedAt}
            completedAt={data.welcomeCompletedAt}
          />
          <SelfServiceStep
            label="Training Videos"
            icon={PlayCircleIcon}
            completed={!!data.videosCompletedAt}
            completedAt={data.videosCompletedAt}
            detail={`${videoProgress.filter((v) => v.percentWatched >= 90).length} completed`}
          />
          <SelfServiceStep
            label="Knowledge Quiz"
            icon={QuestionMarkCircleIcon}
            completed={!!data.quizPassedAt}
            completedAt={data.quizPassedAt}
            detail={
              data.quizPassedAt
                ? `Passed with ${data.quizScore}%`
                : data.quizAttempts > 0
                ? `${data.quizAttempts} attempts, best: ${data.quizScore}%`
                : "Not started"
            }
          />
          <SelfServiceStep
            label="Profile Setup"
            icon={UserIcon}
            completed={!!data.profileCompletedAt}
            completedAt={data.profileCompletedAt}
          />
          <SelfServiceStep
            label="W-9 Form"
            icon={DocumentTextIcon}
            completed={!!data.w9CompletedAt}
            completedAt={data.w9CompletedAt}
          />
          <SelfServiceStep
            label="Orientation Session"
            icon={CalendarDaysIcon}
            completed={!!data.orientationAttendedAt}
            completedAt={data.orientationAttendedAt}
            detail={
              data.orientationAttendedAt
                ? "Attended"
                : data.orientationSession
                ? `Registered: ${data.orientationSession.title}`
                : "Not registered"
            }
          />
          <SelfServiceStep
            label="Training"
            icon={CalendarDaysIcon}
            completed={!!data.trainingCompletedAt}
            completedAt={data.trainingCompletedAt}
          />
          <SelfServiceStep
            label="Shadow Lessons"
            icon={CalendarDaysIcon}
            completed={!!data.shadowCompletedAt}
            completedAt={data.shadowCompletedAt}
          />
        </div>
      </div>

      {/* Return Reason Banner */}
      {data.returnedAt && data.returnReason && (
        <div className="bg-error-light border border-error rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-body-md font-semibold text-error-dark mb-1">
              Returned for Corrections
            </h3>
            <p className="text-body-sm text-error-dark">{data.returnReason}</p>
            <p className="text-body-xs text-error mt-2">
              Returned on {new Date(data.returnedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
