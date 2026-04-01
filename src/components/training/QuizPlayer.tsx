"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Custom hook for swipe detection
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

interface QuizPlayerProps {
  questions: QuizQuestion[];
  passingScore: number;
  moduleTitle: string;
  timeLimit?: number; // in minutes, optional
  onComplete: (score: number, answers: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

export default function QuizPlayer({
  questions,
  passingScore,
  moduleTitle,
  timeLimit,
  onComplete,
  onClose,
}: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      for (const q of questions) {
        if (answers[q.id] === q.correctAnswer) {
          correct++;
        }
      }
      const score = Math.round((correct / questions.length) * 100);

      await onComplete(score, answers);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, questions, onComplete]);

  const handleConfirmSubmit = () => {
    if (answeredCount < questions.length) {
      setShowConfirmSubmit(true);
    } else {
      handleSubmit();
    }
  };

  // Swipe gesture support for mobile
  const swipeHandlers = useSwipe(handleNext, handlePrev);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-neutral-900">Module Quiz</h2>
            <p className="text-sm text-neutral-500">{moduleTitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  timeRemaining < 60
                    ? "bg-error-light text-error-dark"
                    : timeRemaining < 300
                    ? "bg-warning-light text-warning-dark"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-neutral-500">
              {answeredCount} answered • {passingScore}% to pass
            </span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Navigation Dots */}
        <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-center gap-2 flex-wrap">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-primary-500 text-white scale-110"
                    : isAnswered
                    ? "bg-success-light text-success-dark"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                {isAnswered && !isCurrent ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </button>
            );
          })}
        </div>

        {/* Question Content - with swipe support */}
        <div
          className="flex-1 overflow-y-auto p-6 touch-pan-y"
          onTouchStart={swipeHandlers.onTouchStart}
          onTouchMove={swipeHandlers.onTouchMove}
          onTouchEnd={swipeHandlers.onTouchEnd}
        >
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">
            {currentQuestion.question}
          </h3>

          {/* Mobile swipe hint */}
          <p className="text-xs text-neutral-400 text-center mb-4 md:hidden">
            Swipe left/right to navigate questions
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "border-primary-500 bg-primary-500"
                        : "border-neutral-300"
                    }`}
                  >
                    {isSelected && <CheckCircleIcon className="h-3 w-3 text-white fill-current" />}
                  </div>
                  <span
                    className={`flex-1 ${
                      isSelected ? "text-primary-700 font-medium" : "text-neutral-700"
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-6"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-modal">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-warning-light flex items-center justify-center">
                  <ExclamationCircleIcon className="h-5 w-5 text-warning" />
                </div>
                <h3 className="font-semibold text-neutral-900">
                  Incomplete Quiz
                </h3>
              </div>
              <p className="text-neutral-600 mb-6">
                You have only answered {answeredCount} of {questions.length} questions.
                Unanswered questions will be marked as incorrect. Are you sure you want
                to submit?
              </p>
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  Continue Quiz
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    handleSubmit();
                  }}
                  disabled={isSubmitting}
                >
                  Submit Anyway
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
