"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingVideo } from "@prisma/client";
import { VimeoPlayer } from "./VimeoPlayer";
import { ConfettiCelebration } from "./ConfettiCelebration";

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: unknown;
  order: number;
}

interface VideoProgressData {
  percentWatched: number;
  videoCompletedAt: string | null;
  quizPassedAt: string | null;
  quizScore: number | null;
  quizAttempts: number;
}

interface VideoQuizStepProps {
  video: OnboardingVideo;
  videoPart: number;
  progressId: string;
  videoProgress: VideoProgressData | null;
  questions: QuizQuestion[];
  totalParts: number;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export function VideoQuizStep({
  video,
  videoPart,
  progressId,
  videoProgress,
  questions,
  totalParts,
}: VideoQuizStepProps) {
  const router = useRouter();
  const [watchPercent, setWatchPercent] = useState(videoProgress?.percentWatched ?? 0);
  const [videoComplete, setVideoComplete] = useState(!!videoProgress?.videoCompletedAt);
  const [quizPassed, setQuizPassed] = useState(!!videoProgress?.quizPassedAt);
  const [showQuiz, setShowQuiz] = useState(videoComplete && !quizPassed);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Suppress unused variable warnings for progressId
  void progressId;

  const handleVideoProgress = useCallback(
    async (percent: number) => {
      setWatchPercent(percent);

      // Report to API
      try {
        await fetch(`/api/onboarding/videos/${videoPart}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ percentWatched: percent }),
        });
      } catch {
        // Silently fail — progress will be saved on next report
      }

      if (percent >= 90 && !videoComplete) {
        setVideoComplete(true);
        if (questions.length > 0) {
          setShowQuiz(true);
        } else {
          // No quiz — auto-advance
          setShowCelebration(true);
          setTimeout(() => {
            if (videoPart < totalParts) {
              router.push(`/onboarding/videos/${videoPart + 1}`);
            } else {
              router.push("/onboarding/videos");
            }
            router.refresh();
          }, 2000);
        }
      }
    },
    [videoPart, videoComplete, questions.length, totalParts, router]
  );

  const handleVideoComplete = useCallback(() => {
    handleVideoProgress(100);
  }, [handleVideoProgress]);

  const handleQuizSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/onboarding/videos/${videoPart}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      setQuizResult(data);

      if (data.passed) {
        setQuizPassed(true);
        setShowCelebration(true);

        // Also trigger phase recalculation
        fetch("/api/onboarding/phases", { method: "POST" }).catch(() => {});

        setTimeout(() => {
          if (videoPart < totalParts) {
            router.push(`/onboarding/videos/${videoPart + 1}`);
          } else {
            router.push("/onboarding/videos");
          }
          router.refresh();
        }, 2500);
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryQuiz = () => {
    setAnswers({});
    setQuizResult(null);
  };

  const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-6">
      {showCelebration && <ConfettiCelebration />}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/onboarding/videos"
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Videos
          </Link>
          <span className="text-xs font-semibold text-neutral-400 uppercase">
            Part {videoPart} of {totalParts}
          </span>
        </div>

        {/* Video Section */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-5">
          {/* Video Player */}
          <div className="aspect-video bg-neutral-900">
            <VimeoPlayer
              vimeoId={video.vimeoId}
              hash={video.vimeoHash || undefined}
              title={video.title}
              onProgress={handleVideoProgress}
              onComplete={handleVideoComplete}
            />
          </div>

          {/* Video Info */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-primary-500 uppercase">Part {videoPart}</span>
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDuration(video.duration)}
              </span>
              {videoComplete && (
                <span className="text-xs font-medium text-[#2A9147] bg-[#E8F8ED] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" /> Watched
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">{video.title}</h2>
            {video.description && (
              <p className="text-sm text-neutral-500 mt-1">{video.description}</p>
            )}

            {/* Watch Progress */}
            {!videoComplete && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-400">Watch progress</span>
                  <span className="text-xs text-neutral-500 tabular-nums">{Math.round(watchPercent)}%</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-300 rounded-full transition-all"
                    style={{ width: `${watchPercent}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">Watch at least 90% to unlock the quiz</p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Section */}
        {showQuiz && !quizPassed && questions.length > 0 && (
          <div className="bg-white rounded-xl border border-primary-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              Quiz: {video.title.replace(/^Orientation Part \d+ - /, "")}
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Answer all questions correctly to continue. You need 80% or higher to pass.
            </p>

            {quizResult && !quizResult.passed && (
              <div className="bg-[#FCE8F0] border border-[#DA2E72]/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-[#DA2E72] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#AE255B]">
                      Score: {quizResult.score}% ({quizResult.correctCount}/{quizResult.totalQuestions} correct)
                    </p>
                    <p className="text-xs text-[#DA2E72] mt-0.5">Review the video and try again.</p>
                  </div>
                </div>
                <button
                  onClick={handleRetryQuiz}
                  className="mt-3 px-4 py-2 text-sm font-medium text-primary-500 bg-white border border-neutral-300 rounded-[10px] hover:bg-neutral-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!quizResult && (
              <div className="space-y-5">
                {questions.map((q, qi) => {
                  const options = q.options as Array<{ id: string; text: string }>;
                  return (
                    <div key={q.id}>
                      <p className="text-sm font-medium text-neutral-900 mb-2">
                        {qi + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {options.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                              answers[q.id] === option.id
                                ? "border-primary-300 bg-primary-50"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={option.id}
                              checked={answers[q.id] === option.id}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: option.id }))}
                              className="sr-only"
                            />
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              answers[q.id] === option.id
                                ? "border-primary-500 bg-primary-500"
                                : "border-neutral-300"
                            }`}>
                              {answers[q.id] === option.id && (
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-sm text-neutral-700">{option.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleQuizSubmit}
                  disabled={!allAnswered || submitting}
                  className="w-full py-3 text-sm font-medium text-white bg-primary-500 rounded-[10px] hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Already passed */}
        {quizPassed && (
          <div className="bg-[#E8F8ED] border border-[#34B256]/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-[#34B256] flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#2A9147]">Part {videoPart} Complete!</h3>
                <p className="text-xs text-[#34B256] mt-0.5">
                  {videoProgress?.quizScore != null ? `Quiz score: ${videoProgress.quizScore}%` : "Quiz passed"}
                </p>
              </div>
              {videoPart < totalParts ? (
                <Link
                  href={`/onboarding/videos/${videoPart + 1}`}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-[10px] hover:bg-primary-600 transition-colors"
                >
                  Next Part <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <Link
                  href="/onboarding/profile"
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-[10px] hover:bg-primary-600 transition-colors"
                >
                  Continue <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* No quiz for this part + video not complete */}
        {videoComplete && questions.length === 0 && !quizPassed && (
          <div className="bg-[#E8F8ED] border border-[#34B256]/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-[#34B256] flex-shrink-0" />
              <p className="text-sm text-[#2A9147]">Video complete! No quiz required for this part.</p>
            </div>
          </div>
        )}

        {/* Part Navigation */}
        <div className="flex items-center justify-between mt-5">
          {videoPart > 1 ? (
            <Link
              href={`/onboarding/videos/${videoPart - 1}`}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Part {videoPart - 1}
            </Link>
          ) : (
            <div />
          )}
          {videoPart < totalParts && (
            <Link
              href={`/onboarding/videos/${videoPart + 1}`}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors"
            >
              Part {videoPart + 1}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
