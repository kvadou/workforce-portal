"use client";

import { useState } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ExerciseBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

type ExerciseType = "multiple_choice" | "true_false" | "fill_blank" | "open_ended";

const EXERCISE_TYPES = {
  multiple_choice: { label: "Multiple Choice", icon: "🔘" },
  true_false: { label: "True/False", icon: "✓✗" },
  fill_blank: { label: "Fill in the Blank", icon: "___" },
  open_ended: { label: "Open Ended", icon: "💭" },
};

export function ExerciseBlock({ block, isEditing }: ExerciseBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    type: ExerciseType;
    question: string;
    options: ExerciseOption[];
    correctAnswer?: string;
    hint?: string;
    explanation?: string;
    points?: number;
  };

  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const type = content.type || "multiple_choice";
  const options = content.options || [];
  const points = content.points || 1;

  const addOption = () => {
    const newOption: ExerciseOption = {
      id: `opt_${Date.now()}`,
      text: `Option ${options.length + 1}`,
      isCorrect: false,
    };
    updateBlock(block.id, { options: [...options, newOption] });
  };

  const updateOption = (id: string, updates: Partial<ExerciseOption>) => {
    updateBlock(block.id, {
      options: options.map((opt) =>
        opt.id === id ? { ...opt, ...updates } : opt
      ),
    });
  };

  const removeOption = (id: string) => {
    updateBlock(block.id, {
      options: options.filter((opt) => opt.id !== id),
    });
  };

  const setCorrectOption = (id: string) => {
    updateBlock(block.id, {
      options: options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id,
      })),
    });
  };

  const checkAnswer = () => {
    setShowResult(true);
  };

  const resetExercise = () => {
    setUserAnswer(null);
    setShowResult(false);
    setShowHint(false);
  };

  const isCorrect = () => {
    if (type === "multiple_choice" || type === "true_false") {
      const correctOption = options.find((opt) => opt.isCorrect);
      return userAnswer === correctOption?.id;
    }
    if (type === "fill_blank") {
      return (
        userAnswer?.toLowerCase().trim() ===
        content.correctAnswer?.toLowerCase().trim()
      );
    }
    return false;
  };

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">Exercise</span>
        </div>

        {/* Exercise type selector */}
        <div>
          <label className="block text-sm text-neutral-500 mb-2">Type</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EXERCISE_TYPES) as ExerciseType[]).map((t) => (
              <button
                key={t}
                onClick={() => updateBlock(block.id, { type: t })}
                className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 ${
                  type === t
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <span>{EXERCISE_TYPES[t].icon}</span>
                {EXERCISE_TYPES[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm text-neutral-500 mb-1">Question</label>
          <textarea
            value={content.question || ""}
            onChange={(e) => updateBlock(block.id, { question: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            placeholder="Enter your question..."
            rows={2}
          />
        </div>

        {/* Options for multiple choice / true false */}
        {(type === "multiple_choice" || type === "true_false") && (
          <div className="space-y-2">
            <label className="block text-sm text-neutral-500">Options</label>
            {type === "true_false" && options.length === 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateBlock(block.id, {
                      options: [
                        { id: "true", text: "True", isCorrect: true },
                        { id: "false", text: "False", isCorrect: false },
                      ],
                    })
                  }
                  className="px-3 py-2 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  Add True/False Options
                </button>
              </div>
            )}
            {options.map((option) => (
              <div key={option.id} className="flex items-start gap-2">
                <button
                  onClick={() => setCorrectOption(option.id)}
                  className={`mt-2 h-5 w-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                    option.isCorrect
                      ? "border-success bg-success"
                      : "border-neutral-300 hover:border-success"
                  }`}
                >
                  {option.isCorrect && (
                    <CheckCircleIcon className="h-3 w-3 text-white" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      updateOption(option.id, { text: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="Option text"
                  />
                  <input
                    type="text"
                    value={option.explanation || ""}
                    onChange={(e) =>
                      updateOption(option.id, { explanation: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                    placeholder="Explanation (shown after answer)"
                  />
                </div>
                {type === "multiple_choice" && (
                  <button
                    onClick={() => removeOption(option.id)}
                    className="mt-2 p-1 text-neutral-400 hover:text-error"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {type === "multiple_choice" && (
              <button
                onClick={addOption}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded"
              >
                <PlusIcon className="h-4 w-4" />
                Add Option
              </button>
            )}
          </div>
        )}

        {/* Fill in the blank answer */}
        {type === "fill_blank" && (
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Correct Answer
            </label>
            <input
              type="text"
              value={content.correctAnswer || ""}
              onChange={(e) =>
                updateBlock(block.id, { correctAnswer: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="The correct answer"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Use ___ in your question where the blank should appear
            </p>
          </div>
        )}

        {/* Hint and explanation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Hint (optional)
            </label>
            <input
              type="text"
              value={content.hint || ""}
              onChange={(e) => updateBlock(block.id, { hint: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="A helpful hint..."
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Points
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) =>
                updateBlock(block.id, { points: parseInt(e.target.value) || 1 })
              }
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {type !== "multiple_choice" && type !== "true_false" && (
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Explanation (shown after answer)
            </label>
            <textarea
              value={content.explanation || ""}
              onChange={(e) =>
                updateBlock(block.id, { explanation: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              placeholder="Explain the correct answer..."
              rows={2}
            />
          </div>
        )}
      </div>
    );
  }

  // View mode
  if (!content.question) return null;

  return (
    <div className="border border-neutral-200 rounded-xl p-6 my-6 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-primary-600">
          <TrophyIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Exercise</span>
        </div>
        <span className="text-xs text-neutral-400">{points} point{points > 1 ? "s" : ""}</span>
      </div>

      <p className="text-lg text-neutral-900 mb-4">{content.question}</p>

      {/* Multiple choice / True-False */}
      {(type === "multiple_choice" || type === "true_false") && (
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => !showResult && setUserAnswer(option.id)}
              disabled={showResult}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                showResult
                  ? option.isCorrect
                    ? "border-success bg-success-light"
                    : userAnswer === option.id
                    ? "border-error bg-error-light"
                    : "border-neutral-200"
                  : userAnswer === option.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center ${
                    showResult
                      ? option.isCorrect
                        ? "border-success bg-success"
                        : userAnswer === option.id
                        ? "border-error bg-error"
                        : "border-neutral-300"
                      : userAnswer === option.id
                      ? "border-primary-500 bg-primary-500"
                      : "border-neutral-300"
                  }`}
                >
                  {showResult && option.isCorrect && (
                    <CheckCircleIcon className="h-3 w-3 text-white" />
                  )}
                  {showResult && userAnswer === option.id && !option.isCorrect && (
                    <XCircleIcon className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={showResult && option.isCorrect ? "font-medium" : ""}>
                  {option.text}
                </span>
              </div>
              {showResult && option.explanation && (
                <p className="text-sm text-neutral-600 mt-2 ml-8">
                  {option.explanation}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fill in the blank */}
      {type === "fill_blank" && (
        <div className="space-y-2">
          <input
            type="text"
            value={userAnswer || ""}
            onChange={(e) => !showResult && setUserAnswer(e.target.value)}
            disabled={showResult}
            className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 ${
              showResult
                ? isCorrect()
                  ? "border-success bg-success-light"
                  : "border-error bg-error-light"
                : "border-neutral-200"
            }`}
            placeholder="Type your answer..."
          />
          {showResult && !isCorrect() && (
            <p className="text-sm text-neutral-600">
              Correct answer: <strong>{content.correctAnswer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Open ended */}
      {type === "open_ended" && (
        <div className="space-y-2">
          <textarea
            value={userAnswer || ""}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            placeholder="Write your answer..."
            rows={4}
          />
          {showResult && content.explanation && (
            <div className="p-3 bg-info-light border border-info rounded-lg">
              <p className="text-sm text-info-dark">
                <strong>Sample answer:</strong> {content.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        {!showResult ? (
          <>
            <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
            {content.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
                {showHint ? "Hide" : "Show"} Hint
              </button>
            )}
          </>
        ) : (
          <>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isCorrect()
                  ? "bg-success-light text-success-dark"
                  : "bg-error-light text-error-dark"
              }`}
            >
              {isCorrect() ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Correct!
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5" />
                  Incorrect
                </>
              )}
            </div>
            <button
              onClick={resetExercise}
              className="px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Try Again
            </button>
          </>
        )}
      </div>

      {/* Hint display */}
      {showHint && content.hint && (
        <div className="mt-3 p-3 bg-warning-light border border-warning rounded-lg">
          <p className="text-sm text-warning-dark">
            <strong>Hint:</strong> {content.hint}
          </p>
        </div>
      )}
    </div>
  );
}
