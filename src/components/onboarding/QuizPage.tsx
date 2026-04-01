"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { OnboardingQuizQuestion } from "@prisma/client";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizPageProps {
  questions: OnboardingQuizQuestion[];
  progressId: string;
  previousScore: number | null;
  previousAttempts: number;
  hasPassed: boolean;
}

const PASSING_SCORE = 80;

export function QuizPage({
  questions,
  progressId,
  previousScore,
  previousAttempts,
  hasPassed: initialHasPassed,
}: QuizPageProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(previousScore);
  const [hasPassed, setHasPassed] = useState(initialHasPassed);
  const [attempts, setAttempts] = useState(previousAttempts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const question = questions[currentQuestion];
  const options = question ? (question.options as unknown as QuizOption[]) : [];

  const handleSelectAnswer = useCallback(
    (questionId: string, answerId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
    },
    []
  );

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [currentQuestion, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, progressId }),
      });

      const data = await response.json();

      if (data.success) {
        setScore(data.score);
        setHasPassed(data.passed);
        setAttempts(data.attempts);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, progressId]);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setQuizStarted(true);
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // If user hasn't started the quiz yet, show intro
  if (!quizStarted && !showResults && !hasPassed) {
    return (
      <div className="p-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center mx-auto mb-6">
                <ExclamationCircleIcon className="h-8 w-8 text-primary-600" />
              </div>

              <h1 className="text-heading-lg text-neutral-900 mb-4">
                Knowledge Quiz
              </h1>

              <p className="text-body-md text-neutral-600 mb-6">
                Test your understanding of the Acme Workforce orientation
                materials. You need to score at least{" "}
                <span className="font-semibold">{PASSING_SCORE}%</span> to pass.
              </p>

              <button
                onClick={() => setQuizStarted(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-body-md font-medium"
              >
                Start Quiz
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-heading-sm text-neutral-900 mb-4">
                Quiz Details
              </h3>
              <ul className="text-body-sm text-neutral-600 space-y-3">
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-body-xs">
                    {questions.length}
                  </span>
                  Questions to answer
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-success-light flex items-center justify-center text-success-dark font-semibold text-body-xs">
                    {PASSING_SCORE}
                  </span>
                  Passing score (%)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowPathIcon className="h-5 w-5 text-neutral-400" />
                  Unlimited retries
                </li>
              </ul>
            </div>

            {attempts > 0 && (
              <div className="bg-warning-light border border-warning rounded-xl p-4">
                <h4 className="text-body-md font-semibold text-warning-dark mb-2">
                  Previous Attempts
                </h4>
                <p className="text-body-sm text-warning-dark">
                  {attempts} attempt{attempts > 1 ? "s" : ""} • Best score: {previousScore}%
                </p>
              </div>
            )}

            <div className="bg-info-light border border-info rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-info-dark mb-2">
                Tip
              </h4>
              <p className="text-body-sm text-info-dark">
                Review the training videos before taking the quiz for the best results.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults) {
    const correctAnswers = questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    );

    return (
      <div className="p-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`rounded-xl shadow-sm p-8 text-center ${
                hasPassed ? "bg-success-light" : "bg-warning-light"
              }`}
            >
              <div
                className={`h-16 w-16 rounded-lg flex items-center justify-center mx-auto mb-6 ${
                  hasPassed ? "bg-success-light" : "bg-warning-light"
                }`}
              >
                {hasPassed ? (
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                ) : (
                  <XCircleIcon className="h-8 w-8 text-warning" />
                )}
              </div>

              <h1
                className={`text-heading-lg mb-2 ${
                  hasPassed ? "text-success-dark" : "text-warning-dark"
                }`}
              >
                {hasPassed ? "Congratulations!" : "Keep Learning!"}
              </h1>

              <p
                className={`text-heading-md mb-6 ${
                  hasPassed ? "text-success" : "text-warning"
                }`}
              >
                You scored {score}%
              </p>

              <p className="text-body-md text-neutral-600 mb-6">
                {hasPassed
                  ? "You passed the quiz! You can now continue to complete your profile."
                  : `You need ${PASSING_SCORE}% to pass. Review the materials and try again!`}
              </p>

              {hasPassed ? (
                <Link
                  href="/onboarding/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-body-md font-medium"
                >
                  Continue to Profile
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : (
                <div className="flex flex-col gap-4 items-center">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-body-md font-medium"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Try Again
                  </button>
                  <Link
                    href="/onboarding/videos"
                    className="text-primary-600 hover:text-primary-700 text-body-sm"
                  >
                    Review Training Videos
                  </Link>
                </div>
              )}
            </div>

            {/* Answer Review */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-heading-md text-neutral-900 mb-4">
                Answer Review
              </h2>
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  const qOptions = q.options as unknown as QuizOption[];
                  const correctOption = qOptions.find(
                    (o) => o.id === q.correctAnswer
                  );
                  const userOption = qOptions.find((o) => o.id === userAnswer);

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect ? "border-success bg-success-light" : "border-error bg-error-light"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`h-6 w-6 rounded-lg flex items-center justify-center text-body-xs font-semibold ${
                            isCorrect
                              ? "bg-success-light text-success-dark"
                              : "bg-error-light text-error-dark"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-body-md text-neutral-900 mb-2">
                            {q.question}
                          </p>
                          <p
                            className={`text-body-sm ${
                              isCorrect ? "text-success" : "text-error"
                            }`}
                          >
                            Your answer: {userOption?.text || "Not answered"}
                          </p>
                          {!isCorrect && (
                            <p className="text-body-sm text-success mt-1">
                              Correct answer: {correctOption?.text}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-body-xs text-neutral-500 mt-2 italic">
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-heading-sm text-neutral-900 mb-4">
                Results Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-body-sm text-neutral-600">Score</span>
                  <span className={`text-heading-md font-bold ${hasPassed ? "text-success" : "text-warning"}`}>
                    {score}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-body-sm text-neutral-600">Correct</span>
                  <span className="text-body-md font-semibold text-neutral-900">
                    {correctAnswers.length}/{questions.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-neutral-600">Attempt</span>
                  <span className="text-body-md font-semibold text-neutral-900">
                    #{attempts}
                  </span>
                </div>
              </div>
            </div>

            {!hasPassed && (
              <div className="bg-info-light border border-info rounded-xl p-4">
                <h4 className="text-body-md font-semibold text-info-dark mb-2">
                  Tips for Success
                </h4>
                <ul className="text-body-sm text-info-dark space-y-1">
                  <li>• Re-watch the training videos</li>
                  <li>• Take notes on key concepts</li>
                  <li>• Focus on questions you missed</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show already passed message
  if (hasPassed) {
    return (
      <div className="p-6">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-body-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-success-light rounded-xl shadow-sm p-8 text-center">
              <div className="h-16 w-16 rounded-lg bg-success-light flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-success" />
              </div>

              <h1 className="text-heading-lg text-success-dark mb-2">Quiz Complete!</h1>

              <p className="text-body-md text-neutral-600 mb-6">
                You&apos;ve already passed this quiz with a score of {score}%.
              </p>

              <Link
                href="/onboarding/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-success text-white rounded-lg hover:bg-success-dark transition-colors text-body-md font-medium"
              >
                Continue to Profile
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-heading-sm text-neutral-900 mb-4">
                Your Results
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <span className="text-body-sm text-neutral-600">Score</span>
                  <span className="text-heading-md font-bold text-success">
                    {score}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-neutral-600">Status</span>
                  <span className="px-3 py-1 bg-success-light text-success-dark rounded-full text-body-sm font-medium">
                    Passed
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-info-light border border-info rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-info-dark mb-2">
                Next Step
              </h4>
              <p className="text-body-sm text-info-dark">
                Complete your profile to continue with the onboarding process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="p-6">
      <Link
        href="/onboarding"
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="text-body-sm">Back to Dashboard</span>
      </Link>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm text-neutral-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-body-sm text-neutral-600">
            {answeredCount} answered
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-primary-600 rounded-full h-2 transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          {question && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-heading-md text-neutral-900 mb-6">
                {question.question}
              </h2>

              <div className="space-y-3">
                {options.map((option) => {
                  const isSelected = answers[question.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(question.id, option.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-200 hover:border-primary-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-primary-500 bg-primary-500"
                              : "border-neutral-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-body-md text-neutral-900">
                          {option.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Next
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-success text-white rounded-lg hover:bg-success-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Question Navigator */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 lg:sticky lg:top-6">
            <h3 className="text-heading-sm text-neutral-900 mb-4">
              Questions
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentQuestion === index;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-full aspect-square rounded-lg text-body-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-primary-600 text-white"
                        : isAnswered
                        ? "bg-success-light text-success-dark hover:bg-success-light"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-4 text-body-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-success-light" />
                  Answered
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-neutral-100" />
                  Unanswered
                </div>
              </div>
            </div>
          </div>

          {allAnswered && (
            <div className="bg-success-light border border-success rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-success-dark mb-2">
                Ready to Submit!
              </h4>
              <p className="text-body-sm text-success-dark">
                You&apos;ve answered all {questions.length} questions. Click Submit Quiz when you&apos;re ready.
              </p>
            </div>
          )}

          {!allAnswered && answeredCount > 0 && (
            <div className="bg-warning-light border border-warning rounded-xl p-4">
              <h4 className="text-body-md font-semibold text-warning-dark mb-2">
                {questions.length - answeredCount} questions left
              </h4>
              <p className="text-body-sm text-warning-dark">
                Answer all questions to submit the quiz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
