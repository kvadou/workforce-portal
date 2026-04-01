"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  LockClosedIcon,
  MapPinIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  AcademicCapIcon,
  HeartIcon,
  FlagIcon,
  BoltIcon,
  ShieldCheckIcon,
  FireIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingJourneyStep, OnboardingProgress, OnboardingStatus } from "@prisma/client";

// Icon mapping
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
};

interface QuestMapProps {
  journeySteps: OnboardingJourneyStep[];
  progress: OnboardingProgress;
  currentStatus: OnboardingStatus;
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

// Get step colors based on color string
const stepColors: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  purple: { bg: "bg-primary-500", text: "text-primary-600", glow: "shadow-primary-400/50", border: "border-primary-400" },
  blue: { bg: "bg-info", text: "text-info", glow: "shadow-info/50", border: "border-info" },
  green: { bg: "bg-success", text: "text-success", glow: "shadow-success/50", border: "border-success" },
  cyan: { bg: "bg-info", text: "text-info", glow: "shadow-info/50", border: "border-info" },
  pink: { bg: "bg-error", text: "text-error", glow: "shadow-error/50", border: "border-error" },
  indigo: { bg: "bg-primary-500", text: "text-primary-600", glow: "shadow-primary-400/50", border: "border-primary-400" },
  amber: { bg: "bg-warning", text: "text-warning", glow: "shadow-warning/50", border: "border-warning" },
};

export function QuestMap({ journeySteps, progress, currentStatus }: QuestMapProps) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  // Find current step index
  const currentStepIndex = journeySteps.findIndex((step) => {
    const completionValue = progress[step.completionField as keyof OnboardingProgress];
    return !completionValue;
  });

  // Calculate path curve direction alternating
  const getPathPosition = (index: number) => {
    const isEven = index % 2 === 0;
    return isEven ? "left" : "right";
  };

  return (
    <div className="relative py-6 px-3 overflow-hidden">
      {/* Background decorative elements - Acme Workforce grass board */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grass checkered pattern from Acme Workforce board - stretched to cover */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'url(/images/grass_15x15_no_border.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Soft vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/40" />
      </div>

      {/* Start Point at Top */}
      <div className="relative flex justify-center mb-6">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-gradient-to-br from-success to-success-dark rounded-lg flex items-center justify-center shadow-sm shadow-success/50">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div className="mt-1.5 px-2 py-0.5 bg-success-light rounded-full">
            <span className="text-[10px] font-bold text-success-dark uppercase tracking-wide">Start</span>
          </div>
        </div>
      </div>

      {/* Quest Path */}
      <div className="relative max-w-md mx-auto">
        {/* SVG Path connecting nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Journey Steps */}
        <div className="space-y-4 relative">
          {journeySteps.map((step, index) => {
            const StepIcon = iconMap[step.icon] || CheckCircleIcon;
            const colors = stepColors[step.color] || stepColors.purple;
            const completionValue = progress[step.completionField as keyof OnboardingProgress];
            const isComplete = !!completionValue;
            const isUnlocked = isStepUnlocked(currentStatus, step.requiredStatus as OnboardingStatus);
            const isCurrent = currentStepIndex === index;
            const position = getPathPosition(index);
            const isHovered = hoveredStep === step.id;

            return (
              <div
                key={step.id}
                className={`relative flex items-center gap-3 ${
                  position === "left" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Connecting path line */}
                {index < journeySteps.length - 1 && (
                  <div
                    className={`absolute w-0.5 bg-gradient-to-b ${
                      isComplete ? "from-success-light to-success" : "from-neutral-200 to-neutral-300"
                    }`}
                    style={{
                      height: "calc(100% + 16px)",
                      top: "50%",
                      left: position === "left" ? "24px" : "auto",
                      right: position === "right" ? "24px" : "auto",
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Node */}
                <Link
                  href={isUnlocked ? step.href : "#"}
                  onClick={(e) => !isUnlocked && e.preventDefault()}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`relative z-10 flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? "bg-gradient-to-br from-success to-success-dark shadow-sm shadow-success/50 hover:shadow-card-hover hover:shadow-success/60 hover:scale-105"
                      : isCurrent
                      ? `bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm ${colors.glow} animate-pulse hover:scale-105`
                      : isUnlocked
                      ? `${colors.bg} shadow-sm hover:shadow-sm ${colors.glow} hover:scale-105`
                      : "bg-neutral-200 shadow-sm cursor-not-allowed"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  ) : isUnlocked ? (
                    <StepIcon className="h-5 w-5 text-white" />
                  ) : (
                    <LockClosedIcon className="h-4 w-4 text-neutral-400" />
                  )}

                  {/* Current step indicator */}
                  {isCurrent && (
                    <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                      <div className="h-5 w-5 bg-white rounded-lg shadow-sm flex items-center justify-center">
                        <MapPinIcon className="h-3 w-3 text-primary-600" />
                      </div>
                    </div>
                  )}

                  {/* Gold star for completed */}
                  {isComplete && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <StarIcon className="h-4 w-4 text-warning fill-warning" />
                    </div>
                  )}
                </Link>

                {/* Step Info Card */}
                <div
                  className={`flex-1 relative bg-white rounded-xl border p-3 transition-all duration-300 ${
                    isComplete
                      ? "border-success shadow-sm"
                      : isCurrent
                      ? `${colors.border} shadow-sm ring-1 ring-primary-100`
                      : isUnlocked
                      ? "border-neutral-200 shadow-sm hover:border-neutral-300"
                      : "border-neutral-100 opacity-60"
                  } ${isHovered && isUnlocked ? "transform scale-[1.01]" : ""}`}
                >
                  {/* Current step label */}
                  {isCurrent && (
                    <div className="absolute -top-2 left-3">
                      <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wide">
                        You Are Here
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`text-sm font-semibold ${
                        isComplete
                          ? "text-success-dark"
                          : isCurrent
                          ? "text-primary-700"
                          : isUnlocked
                          ? "text-neutral-900"
                          : "text-neutral-600"
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs mt-0.5 ${
                        isComplete || isCurrent ? "text-neutral-600" : "text-neutral-500"
                      }`}>
                        {step.shortDescription || step.description}
                      </p>
                    </div>

                    {isUnlocked && !isComplete && (
                      <ArrowRightIcon className={`h-4 w-4 flex-shrink-0 ${
                        isCurrent ? "text-primary-500" : "text-neutral-300"
                      }`} />
                    )}

                    {isComplete && (
                      <div className="flex-shrink-0 h-5 w-5 bg-success-light rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="h-3 w-3 text-success" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finish Line - Castle at Bottom */}
        <div className="relative flex justify-center mt-6">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 bg-gradient-to-br from-warning to-accent-orange rounded-xl flex items-center justify-center shadow-sm shadow-warning/50 transform hover:scale-110 transition-transform">
              <TrophyIcon className="h-7 w-7 text-white" />
            </div>
            <div className="mt-1.5 px-2 py-0.5 bg-warning-light rounded-full">
              <span className="text-[10px] font-bold text-warning-dark uppercase tracking-wide">Finish</span>
            </div>
            <p className="text-xs text-neutral-700 font-medium mt-1">Become an Active Tutor</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-neutral-700 font-medium">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-success rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-primary-500 rounded animate-pulse" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-info rounded" />
          <span>Unlocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-neutral-200 rounded" />
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
}
