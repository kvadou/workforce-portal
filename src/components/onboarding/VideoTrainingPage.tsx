"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  PlayCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingVideo } from "@prisma/client";
import { VimeoPlayer } from "./VimeoPlayer";

interface VideoProgress {
  videoId: string;
  percentWatched: number;
  completedAt?: string;
}

interface VideoTrainingPageProps {
  videos: OnboardingVideo[];
  videoProgress: VideoProgress[];
  progressId: string;
  allVideosComplete: boolean;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes} min`;
}

export function VideoTrainingPage({
  videos,
  videoProgress,
  progressId,
  allVideosComplete,
}: VideoTrainingPageProps) {
  const [selectedVideo, setSelectedVideo] = useState<OnboardingVideo | null>(
    videos[0] || null
  );
  const [localProgress, setLocalProgress] = useState<VideoProgress[]>(videoProgress);

  const getVideoProgress = useCallback(
    (videoId: string): VideoProgress | undefined => {
      return localProgress.find((p) => p.videoId === videoId);
    },
    [localProgress]
  );

  const isVideoComplete = useCallback(
    (videoId: string): boolean => {
      const progress = getVideoProgress(videoId);
      return progress ? progress.percentWatched >= 90 : false;
    },
    [getVideoProgress]
  );

  const completedCount = videos.filter((v) => isVideoComplete(v.id)).length;
  const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
  const watchedDuration = videos.reduce((sum, v) => {
    const progress = getVideoProgress(v.id);
    if (!progress) return sum;
    return sum + Math.floor((progress.percentWatched / 100) * v.duration);
  }, 0);

  const handleProgressUpdate = useCallback(
    async (videoId: string, percentWatched: number) => {
      // Update local state
      setLocalProgress((prev) => {
        const existing = prev.find((p) => p.videoId === videoId);
        if (existing) {
          // Only update if new progress is higher
          if (percentWatched <= existing.percentWatched) return prev;
          return prev.map((p) =>
            p.videoId === videoId
              ? {
                  ...p,
                  percentWatched,
                  completedAt: percentWatched >= 90 ? new Date().toISOString() : p.completedAt,
                }
              : p
          );
        }
        return [
          ...prev,
          {
            videoId,
            percentWatched,
            completedAt: percentWatched >= 90 ? new Date().toISOString() : undefined,
          },
        ];
      });

      // Save to server
      try {
        await fetch(`/api/onboarding/videos/${videoId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ percentWatched, progressId }),
        });
      } catch (error) {
        console.error("Failed to save video progress:", error);
      }
    },
    [progressId]
  );

  const handleNextVideo = useCallback(() => {
    if (!selectedVideo) return;
    const currentIndex = videos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex < videos.length - 1) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  }, [selectedVideo, videos]);

  const handlePrevVideo = useCallback(() => {
    if (!selectedVideo) return;
    const currentIndex = videos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex > 0) {
      setSelectedVideo(videos[currentIndex - 1]);
    }
  }, [selectedVideo, videos]);

  const allComplete = completedCount === videos.length && videos.length > 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-body-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-heading-lg text-neutral-900">Orientation Videos</h1>
          <p className="text-body-md text-neutral-600">
            Complete all 6 videos before taking the quiz
          </p>
        </div>
        {allComplete && (
          <Link
            href="/onboarding/quiz"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Continue to Quiz
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm text-neutral-600">
            {completedCount} of {videos.length} videos completed
          </span>
          <span className="text-body-sm text-neutral-600">
            <ClockIcon className="h-4 w-4 inline mr-1" />
            {formatDuration(watchedDuration)} / {formatDuration(totalDuration)}
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-primary-600 rounded-full h-2 transition-all duration-500"
            style={{ width: `${(completedCount / videos.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {selectedVideo ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <VimeoPlayer
                vimeoId={selectedVideo.vimeoId}
                hash={selectedVideo.vimeoHash || undefined}
                title={selectedVideo.title}
                onProgress={(percent) => handleProgressUpdate(selectedVideo.id, percent)}
                onComplete={() => handleProgressUpdate(selectedVideo.id, 100)}
              />
              <div className="p-4">
                <h2 className="text-heading-md text-neutral-900 mb-2">
                  {selectedVideo.title}
                </h2>
                {selectedVideo.description && (
                  <p className="text-body-sm text-neutral-600 mb-4">
                    {selectedVideo.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-neutral-500" />
                    <span className="text-body-sm text-neutral-600">
                      {formatDuration(selectedVideo.duration)}
                    </span>
                    {isVideoComplete(selectedVideo.id) && (
                      <span className="flex items-center gap-1 text-success text-body-sm">
                        <CheckCircleIcon className="h-4 w-4" />
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevVideo}
                      disabled={videos.findIndex((v) => v.id === selectedVideo.id) === 0}
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextVideo}
                      disabled={
                        videos.findIndex((v) => v.id === selectedVideo.id) ===
                        videos.length - 1
                      }
                      className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <PlayCircleIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">No videos available yet</p>
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="space-y-3">
          <h3 className="text-heading-sm text-neutral-900 mb-2">Video Playlist</h3>
          {videos.map((video, index) => {
            const isSelected = selectedVideo?.id === video.id;
            const isComplete = isVideoComplete(video.id);
            const progress = getVideoProgress(video.id);

            return (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary-300 bg-primary-50"
                    : isComplete
                    ? "border-success bg-success-light hover:border-success"
                    : "border-neutral-200 bg-white hover:border-primary-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-body-sm font-semibold ${
                      isComplete
                        ? "bg-success-light text-success-dark"
                        : isSelected
                        ? "bg-primary-100 text-primary-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-body-sm font-medium truncate ${
                        isSelected ? "text-primary-700" : "text-neutral-900"
                      }`}
                    >
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-body-xs text-neutral-500">
                        {formatDuration(video.duration)}
                      </span>
                      {progress && progress.percentWatched > 0 && !isComplete && (
                        <span className="text-body-xs text-primary-600">
                          {Math.round(progress.percentWatched)}% watched
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion Card */}
      {allComplete && !allVideosComplete && (
        <div className="bg-success-light border border-success rounded-xl p-6 mt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-heading-md text-success-dark">
                All Videos Complete!
              </h3>
              <p className="text-body-md text-success">
                You&apos;re ready to take the knowledge quiz.
              </p>
            </div>
            <Link
              href="/onboarding/quiz"
              className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors"
            >
              Take Quiz
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
