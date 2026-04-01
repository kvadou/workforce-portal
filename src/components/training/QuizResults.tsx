"use client";

import { Button } from "@/components/ui/button";
import {
  TrophyIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  BoltIcon,
  FlagIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { QuizQuestion } from "./QuizPlayer";

interface QuizResultsProps {
  score: number;
  passingScore: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  pointsEarned: number;
  moduleTitle: string;
  remainingAttempts?: number | null;
  maxRetakes?: number;
  onRetry: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export default function QuizResults({
  score,
  passingScore,
  questions,
  answers,
  pointsEarned,
  moduleTitle,
  remainingAttempts,
  maxRetakes,
  onRetry,
  onContinue,
  onClose,
}: QuizResultsProps) {
  const passed = score >= passingScore;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const canRetry = passed || remainingAttempts === null || (remainingAttempts && remainingAttempts > 0);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-neutral-900">Quiz Results</h2>
            <p className="text-sm text-neutral-500">{moduleTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Result Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Score Banner */}
          <div
            className={`p-8 text-center ${
              passed
                ? "bg-gradient-to-br from-success-light to-success-light"
                : "bg-gradient-to-br from-warning-light to-accent-orange-light"
            }`}
          >
            <div
              className={`h-20 w-20 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                passed ? "bg-success-light" : "bg-warning-light"
              }`}
            >
              {passed ? (
                <TrophyIcon className="h-10 w-10 text-success" />
              ) : (
                <XCircleIcon className="h-10 w-10 text-warning" />
              )}
            </div>

            <h3
              className={`text-2xl font-bold mb-2 ${
                passed ? "text-success-dark" : "text-warning-dark"
              }`}
            >
              {passed ? "Congratulations!" : "Not Quite There"}
            </h3>

            <p className="text-neutral-600 mb-2">
              {passed
                ? "You passed the quiz and earned points!"
                : `You need ${passingScore}% to pass. Keep learning and try again!`}
            </p>

            {/* Remaining attempts warning */}
            {!passed && remainingAttempts !== null && remainingAttempts !== undefined && (
              <p className={`text-sm mb-4 ${remainingAttempts === 0 ? "text-error font-medium" : "text-warning"}`}>
                {remainingAttempts === 0
                  ? "No attempts remaining. Contact an admin for help."
                  : `${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining`}
              </p>
            )}

            {/* Score Circle */}
            <div className="relative h-32 w-32 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={passed ? "#22c55e" : "#f59e0b"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 352} 352`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-3xl font-bold ${
                    passed ? "text-success" : "text-warning"
                  }`}
                >
                  {score}%
                </span>
                <span className="text-xs text-neutral-500">Score</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-neutral-700">
                  <FlagIcon className="h-4 w-4" />
                  <span className="font-semibold">{correctCount}/{questions.length}</span>
                </div>
                <span className="text-xs text-neutral-500">Correct</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-neutral-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span className="font-semibold">{passingScore}%</span>
                </div>
                <span className="text-xs text-neutral-500">Required</span>
              </div>
              {passed && pointsEarned > 0 && (
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-warning">
                    <BoltIcon className="h-4 w-4" />
                    <span className="font-semibold">+{pointsEarned}</span>
                  </div>
                  <span className="text-xs text-neutral-500">Points</span>
                </div>
              )}
            </div>
          </div>

          {/* Answer Review */}
          <div className="p-6">
            <h4 className="font-semibold text-neutral-900 mb-4">Review Answers</h4>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                const correctOption = q.options.find((o) => o.id === q.correctAnswer);
                const selectedOption = q.options.find((o) => o.id === userAnswer);

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-success bg-success-light"
                        : "border-error bg-error-light"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCorrect
                            ? "bg-success text-white"
                            : "bg-error text-white"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <XMarkIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        {!isCorrect && selectedOption && (
                          <p className="text-sm text-error mb-1">
                            Your answer: {selectedOption.text}
                          </p>
                        )}
                        <p
                          className={`text-sm ${
                            isCorrect ? "text-success" : "text-success-dark"
                          }`}
                        >
                          {isCorrect ? "Correct!" : `Correct answer: ${correctOption?.text}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          {canRetry ? (
            <Button variant="outline" onClick={onRetry}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {passed ? "Practice Again" : "Try Again"}
            </Button>
          ) : (
            <div className="text-sm text-neutral-500">
              No more attempts
            </div>
          )}

          {passed ? (
            <Button onClick={onContinue}>
              Continue
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Review Module
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
