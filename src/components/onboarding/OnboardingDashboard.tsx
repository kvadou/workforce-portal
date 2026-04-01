"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  LockClosedIcon,
  SparklesIcon,
  StarIcon,
  BookOpenIcon,
  AcademicCapIcon,
  TrophyIcon,
  GiftIcon,
  HeartIcon,
  FlagIcon,
  BoltIcon,
  ShieldCheckIcon,
  FireIcon,
  ChevronDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import type {
  OnboardingProgress,
  OnboardingVideo,
  OnboardingStatus,
  OnboardingJourneyStep,
} from "@prisma/client";
import { ConfettiCelebration } from "./ConfettiCelebration";
import type { BadgeConfig } from "@/lib/onboarding-config";
import type { PhaseInfo } from "@/lib/onboarding-phases";

// Icon mapping from string names to Heroicon components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PlayCircle: PlayCircleIcon,
  HelpCircle: QuestionMarkCircleIcon,
  User: UserIcon,
  FileText: DocumentTextIcon,
  Calendar: CalendarDaysIcon,
  CheckCircle: CheckCircleIcon,
  BookOpen: BookOpenIcon,
  GraduationCap: AcademicCapIcon,
  Award: TrophyIcon,
  Heart: HeartIcon,
  Target: FlagIcon,
  Zap: BoltIcon,
  Shield: ShieldCheckIcon,
  Flame: FireIcon,
  Crown: TrophyIcon,
  Medal: TrophyIcon,
  Star: StarIcon,
  Trophy: TrophyIcon,
  Gift: GiftIcon,
  Video: PlayCircleIcon,
  Eye: EyeIcon,
};

interface ProgressWithRelations extends OnboardingProgress {
  user: {
    name: string | null;
    email: string;
    headshotUrl: string | null;
    w9SignedAt: Date | null;
  };
  orientationSession: { id: string; title: string; scheduledAt: Date } | null;
  videoPartProgress: Array<{
    videoPart: number;
    videoCompletedAt: Date | null;
    quizPassedAt: Date | null;
    quizScore: number | null;
  }>;
}

interface OnboardingDashboardProps {
  progress: ProgressWithRelations;
  videos: OnboardingVideo[];
  completedVideos: number;
  totalVideos: number;
  hasQuiz: boolean;
  journeySteps: OnboardingJourneyStep[];
  badges: BadgeConfig[];
  phases: PhaseInfo[];
  overallProgress: number;
  currentPhase: number;
}

const statusOrder: OnboardingStatus[] = [
  "PENDING",
  "WELCOME",
  "VIDEOS_IN_PROGRESS",
  "QUIZ_PENDING",
  "QUIZ_FAILED",
  "PROFILE_PENDING",
  "W9_PENDING",
  "AWAITING_ORIENTATION",
  "ORIENTATION_SCHEDULED",
  "POST_ORIENTATION_TRAINING",
  "SHADOW_LESSONS",
  "COMPLETED",
  "ACTIVATED",
];

function getStatusIndex(status: OnboardingStatus): number {
  return statusOrder.indexOf(status);
}

function isStepUnlocked(currentStatus: OnboardingStatus, requiredStatus: OnboardingStatus): boolean {
  return getStatusIndex(currentStatus) >= getStatusIndex(requiredStatus);
}

// Preserve these for potential external use
void isStepUnlocked;

export function OnboardingDashboard({
  progress,
  videos: _videos,
  completedVideos,
  totalVideos,
  hasQuiz: _hasQuiz,
  journeySteps,
  badges: _badgeConfigs,
  phases,
  overallProgress,
  currentPhase,
}: OnboardingDashboardProps) {
  const [_showCelebration, _setShowCelebration] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(() => {
    return new Set([currentPhase]);
  });
  const currentStatus = progress.status;
  const firstName = progress.user.name?.split(" ")[0] || "there";

  const togglePhase = (phase: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      {_showCelebration && <ConfettiCelebration />}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 md:p-8 mb-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold text-white">
                Welcome to Acme Workforce, {firstName}!
              </h1>
              <p className="text-white/75 text-sm mt-2 max-w-lg">
                Let&apos;s get you set up to teach the next generation of grandmasters for Acme Workforce!
              </p>
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                    Onboarding Progress
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    Phase {currentPhase > 6 ? 6 : currentPhase} of 6 &middot; {overallProgress}%
                  </span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#50C8DF] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
            {/* User avatar on desktop */}
            <div className="hidden md:flex ml-8">
              {progress.user.headshotUrl ? (
                <img
                  src={progress.user.headshotUrl}
                  alt={progress.user.name || ""}
                  className="h-20 w-20 rounded-xl object-cover border-2 border-white/30"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-white/60" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Video Progress */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
            <p className="text-xs font-medium text-neutral-500 mb-1">Videos Watched</p>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">{completedVideos}/{totalVideos}</p>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: totalVideos > 0 ? `${(completedVideos / totalVideos) * 100}%` : "0%" }} />
            </div>
          </div>

          {/* Quiz Stats */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
            <p className="text-xs font-medium text-neutral-500 mb-1">Quiz Progress</p>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">
              {progress.quizScore ? `${progress.quizScore}%` : "\u2014"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{progress.quizAttempts} attempts</p>
          </div>

          {/* Reward Card */}
          <div className="bg-primary-500 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GiftIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Earn $250</h3>
                <p className="text-xs text-white/75 mt-0.5">Complete all phases to earn your bonus.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Accordion */}
        <div className="space-y-3">
          {phases.map((phase) => {
            const isExpanded = expandedPhases.has(phase.phase);
            const phaseSteps = journeySteps.filter((s) => s.phase === phase.phase);

            return (
              <div
                key={phase.phase}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
                  phase.isCurrent
                    ? "border-primary-200 border-l-[3px] border-l-primary-500"
                    : phase.isComplete
                    ? "border-neutral-200"
                    : "border-neutral-200 opacity-50"
                }`}
              >
                {/* Phase Header */}
                <button
                  onClick={() => (phase.isUnlocked || phase.isComplete) && togglePhase(phase.phase)}
                  disabled={!phase.isUnlocked && !phase.isComplete}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  {/* Phase number circle */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                    phase.isComplete
                      ? "bg-[#E8F8ED] text-[#2A9147]"
                      : phase.isCurrent
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-400"
                  }`}>
                    {phase.isComplete ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      phase.phase
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${
                      phase.isComplete ? "text-neutral-900" : phase.isCurrent ? "text-neutral-900" : "text-neutral-500"
                    }`}>
                      Phase {phase.phase}: {phase.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">{phase.description}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {phase.isComplete && (
                      <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2.5 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                    {phase.isCurrent && (
                      <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                    {!phase.isUnlocked && !phase.isComplete && (
                      <LockClosedIcon className="h-4 w-4 text-neutral-300" />
                    )}

                    {/* Chevron */}
                    {(phase.isUnlocked || phase.isComplete) && (
                      <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`} />
                    )}
                  </div>
                </button>

                {/* Phase Steps — expandable */}
                {isExpanded && (phase.isUnlocked || phase.isComplete) && (
                  <div className="border-t border-neutral-100 px-5 py-3">
                    <div className="space-y-1">
                      {phaseSteps.map((step) => {
                        const StepIcon = iconMap[step.icon] || CheckCircleIcon;
                        const completionValue = progress[step.completionField as keyof typeof progress];
                        const isStepComplete = !!completionValue;
                        const isCurrentStep = !isStepComplete && phase.isCurrent &&
                          phaseSteps.findIndex((s) => !progress[s.completionField as keyof typeof progress]) ===
                          phaseSteps.indexOf(step);

                        return (
                          <Link
                            key={step.id}
                            href={phase.isUnlocked ? step.href : "#"}
                            onClick={(e) => !phase.isUnlocked && e.preventDefault()}
                            className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-200 ${
                              isStepComplete
                                ? "text-neutral-500"
                                : isCurrentStep
                                ? "bg-primary-50 text-neutral-900"
                                : phase.isUnlocked
                                ? "text-neutral-700 hover:bg-neutral-50"
                                : "text-neutral-400 cursor-not-allowed"
                            }`}
                          >
                            {/* Step icon */}
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isStepComplete
                                ? "bg-[#E8F8ED]"
                                : isCurrentStep
                                ? "bg-primary-500"
                                : "bg-neutral-100"
                            }`}>
                              {isStepComplete ? (
                                <CheckCircleIcon className="h-4 w-4 text-[#2A9147]" />
                              ) : (
                                <StepIcon className={`h-4 w-4 ${isCurrentStep ? "text-white" : "text-neutral-400"}`} />
                              )}
                            </div>

                            {/* Step info */}
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${isStepComplete ? "line-through" : isCurrentStep ? "font-medium" : ""}`}>
                                {step.title}
                              </span>
                              {step.shortDescription && (
                                <span className="text-xs text-neutral-400 ml-2">{step.shortDescription}</span>
                              )}
                            </div>

                            {/* Action */}
                            {isCurrentStep && (
                              <span className="text-xs font-medium text-primary-500 flex items-center gap-1 flex-shrink-0">
                                Continue <ArrowRightIcon className="h-3 w-3" />
                              </span>
                            )}
                            {isStepComplete && (
                              <CheckCircleIcon className="h-4 w-4 text-[#34B256] flex-shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {currentStatus === "COMPLETED" && (
          <div className="bg-[#E8F8ED] border border-[#34B256] rounded-xl p-5 mt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[#34B256] rounded-xl flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#2A9147]">All steps complete!</h3>
                <p className="text-sm text-[#34B256]">An admin will review and activate your account soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-5 text-center">
          <p className="text-xs text-neutral-400">
            Need help?{" "}
            <a href="mailto:admin@workforceportal.com" className="font-medium text-primary-500 hover:text-primary-700 transition-colors">
              admin@workforceportal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
