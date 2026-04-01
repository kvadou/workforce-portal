"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlayIcon,
  ChevronRightIcon,
  HeartIcon,
  StarIcon,
  UsersIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { VimeoPlayer } from "./VimeoPlayer";
import { ConfettiCelebration } from "./ConfettiCelebration";

interface WelcomeConfig {
  videoId: string;
  videoHash: string;
  videoTitle: string;
  videoDescription: string;
  headline: string;
  completionBonus: number;
  trainingHours: string;
  shadowLessonsCount: number;
  contactEmail: string;
}

interface WelcomePageProps {
  firstName: string;
  progressId: string;
  config: WelcomeConfig;
  isPreview?: boolean;
}

export function WelcomePage({ firstName, progressId, config, isPreview = false }: WelcomePageProps) {
  const router = useRouter();
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleMarkComplete = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });

      if (response.ok) {
        setShowCelebration(true);
        setTimeout(() => {
          router.refresh();
        }, 2500);
      }
    } catch (error) {
      console.error("Failed to mark welcome complete:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [progressId, isSubmitting, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-info-light to-warning-light">
      {showCelebration && <ConfettiCelebration />}

      {/* Admin Preview Banner */}
      {isPreview && (
        <div className="bg-warning text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              Preview Mode — This is what new tutors see on their first visit
            </span>
          </div>
          <Link
            href="/onboarding"
            className="flex items-center gap-1 text-sm font-medium hover:text-white/80 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Exit Preview
          </Link>
        </div>
      )}

      {/* Desktop: Two-column layout / Mobile: Single column */}
      <div className={`${isPreview ? "" : "min-h-screen"} flex flex-col lg:flex-row`}>
        {/* Left Panel - Branding & Info (Desktop) / Header (Mobile) */}
        <div className="lg:w-[32%] lg:min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-6 lg:p-8 flex flex-col justify-center text-white relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 h-32 w-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 h-48 w-48 bg-white rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 h-24 w-24 bg-white rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="mb-4 lg:mb-6">
              <img
                src="/logo.svg"
                alt="Acme Workforce"
                className="h-14 lg:h-16 w-auto rounded-xl shadow-sm"
              />
            </div>

            {/* Welcome Text */}
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 lg:mb-3">
              Welcome, {firstName}!
            </h1>
            <p className="text-base lg:text-lg text-white/90 mb-4 lg:mb-6">
              {config.headline}
            </p>

            {/* What to expect - Desktop only */}
            <div className="hidden lg:block space-y-3 mb-6">
              <h3 className="text-xs uppercase tracking-wider text-white/70 font-semibold">What to expect</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <PlayIcon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Watch orientation videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Complete a quick knowledge quiz</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <StarIcon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Set up your tutor profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">Join a live orientation session</span>
                </div>
              </div>
            </div>

            {/* Value props - Desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-3 mt-auto pt-6 border-t border-white/20">
              <div>
                <div className="text-2xl font-bold">${config.completionBonus}</div>
                <div className="text-xs text-white/70">Completion bonus</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{config.trainingHours}hr</div>
                <div className="text-xs text-white/70">Training videos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{config.shadowLessonsCount}</div>
                <div className="text-xs text-white/70">Shadow lessons</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Video & CTA */}
        <div className="lg:w-[68%] flex flex-col justify-center p-6 lg:p-10">
          <div className="max-w-3xl mx-auto w-full">
            {/* Video Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-neutral-100">
              {/* Video player area */}
              <div className="relative aspect-video bg-gradient-to-br from-neutral-900 to-neutral-800">
                {!videoStarted ? (
                  <button
                    onClick={() => setVideoStarted(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center text-white group cursor-pointer"
                  >
                    <div className="h-20 w-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110 shadow-sm">
                      <PlayIcon className="h-10 w-10 lg:w-12 lg:h-12 text-white ml-1" />
                    </div>
                    <p className="text-lg lg:text-xl font-semibold">Watch Welcome Message</p>
                    <p className="text-sm text-white/70 mt-1">A personal message from Harlan</p>
                  </button>
                ) : (
                  <VimeoPlayer
                    vimeoId={config.videoId}
                    hash={config.videoHash}
                    title={config.videoTitle}
                    onProgress={(percent) => {
                      if (percent >= 80) setVideoCompleted(true);
                    }}
                    onComplete={() => setVideoCompleted(true)}
                  />
                )}
              </div>

              {/* Video info */}
              <div className="p-5 lg:p-6">
                <h2 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-2">
                  {config.videoTitle}
                </h2>
                <p className="text-neutral-600 mb-4">
                  {config.videoDescription}
                </p>

                {/* Status messages */}
                {videoStarted && !videoCompleted && (
                  <div className="flex items-center gap-2 text-warning bg-warning-light px-4 py-3 rounded-lg">
                    <div className="h-2 w-2 bg-warning rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Keep watching to unlock your journey...</span>
                  </div>
                )}

                {videoCompleted && (
                  <div className="flex items-center gap-2 text-success bg-success-light px-4 py-3 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Video complete! Ready to start your journey?</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            {isPreview ? (
              <Link
                href="/onboarding"
                className="w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-3 bg-warning text-white shadow-sm hover:bg-warning-dark hover:shadow-card-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                <EyeIcon className="h-5 w-5" />
                Exit Preview Mode
              </Link>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={!videoStarted || isSubmitting}
                className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                  videoStarted
                    ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-200 hover:shadow-card-hover hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up your journey...
                  </>
                ) : (
                  <>
                    Start My Onboarding Journey
                    <ChevronRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            )}

            {!videoStarted && !isPreview && (
              <p className="text-center text-sm text-neutral-500 mt-3">
                Watch the welcome video to unlock your onboarding dashboard
              </p>
            )}

            {/* Mobile value props */}
            <div className="grid grid-cols-3 gap-3 mt-8 lg:hidden">
              <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-white/50">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <HeartIcon className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-xs font-medium text-neutral-900">Make Impact</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-white/50">
                <div className="h-10 w-10 bg-info-light rounded-lg flex items-center justify-center mx-auto mb-2">
                  <UsersIcon className="h-5 w-5 text-info" />
                </div>
                <p className="text-xs font-medium text-neutral-900">Join Team</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-3 text-center border border-white/50">
                <div className="h-10 w-10 bg-warning-light rounded-lg flex items-center justify-center mx-auto mb-2">
                  <StarIcon className="h-5 w-5 text-warning" />
                </div>
                <p className="text-xs font-medium text-neutral-900">${config.completionBonus} Bonus</p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-neutral-400 mt-6">
              Questions? <a href={`mailto:${config.contactEmail}`} className="text-primary-600 hover:underline">{config.contactEmail}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
