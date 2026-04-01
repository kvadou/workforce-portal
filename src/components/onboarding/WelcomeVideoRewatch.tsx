"use client";

import Link from "next/link";
import { ArrowLeftIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import { VimeoPlayer } from "./VimeoPlayer";

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

interface WelcomeVideoRewatchProps {
  firstName: string;
  config: WelcomeConfig;
}

export function WelcomeVideoRewatch({ firstName, config }: WelcomeVideoRewatchProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-info-light to-warning-light">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-primary-100 rounded-2xl mb-4">
            <PlayCircleIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Welcome Video
          </h1>
          <p className="text-neutral-600">
            Hey {firstName}! Rewatch the welcome message anytime.
          </p>
        </div>

        {/* Video Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="aspect-video bg-neutral-900">
            <VimeoPlayer
              vimeoId={config.videoId}
              hash={config.videoHash}
              title={config.videoTitle}
            />
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              {config.videoTitle}
            </h2>
            <p className="text-neutral-600">
              {config.videoDescription}
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-success">${config.completionBonus}</p>
            <p className="text-sm text-neutral-500">Completion Bonus</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-info">{config.trainingHours}hr</p>
            <p className="text-sm text-neutral-500">Training Videos</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary-600">{config.shadowLessonsCount}</p>
            <p className="text-sm text-neutral-500">Shadow Lessons</p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Continue Onboarding
            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
