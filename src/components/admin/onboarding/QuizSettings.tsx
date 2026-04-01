"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckIcon, QuestionMarkCircleIcon, PercentBadgeIcon } from "@heroicons/react/24/outline";
import { useAdminConfigs, useUpdateAdminConfigs } from "@/hooks/useOnboardingConfig";

export function QuizSettings() {
  const { data: configs, isLoading } = useAdminConfigs("quiz");
  const updateConfigs = useUpdateAdminConfigs();

  const [passingScore, setPassingScore] = useState<string>("80");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (configs) {
      const scoreConfig = configs.find((c) => c.key === "quiz_passing_score");
      if (scoreConfig) {
        setPassingScore(scoreConfig.value);
      }
    }
  }, [configs]);

  const handleScoreChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setPassingScore(value);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    await updateConfigs.mutateAsync([
      { key: "quiz_passing_score", value: passingScore },
    ]);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const score = parseInt(passingScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Quiz Settings</h2>
          <p className="text-sm text-neutral-500">
            Configure the passing score for the orientation quiz
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateConfigs.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasChanges
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          }`}
        >
          <CheckIcon className="h-4 w-4" />
          {updateConfigs.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Passing Score */}
      <div className="bg-neutral-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-info-light rounded-lg flex items-center justify-center">
            <QuestionMarkCircleIcon className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">Passing Score</h3>
            <p className="text-sm text-neutral-500">
              Minimum percentage required to pass the quiz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Slider */}
          <div className="flex-1">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={passingScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Number Input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="50"
              max="100"
              value={passingScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              className="w-20 px-3 py-2 border border-neutral-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
            <PercentBadgeIcon className="h-5 w-5 text-neutral-400" />
          </div>
        </div>

        {/* Score Preview */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-600">
            With a passing score of <strong>{passingScore}%</strong>, tutors need to
            answer at least:
          </p>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {Math.ceil((score / 100) * 5)}
                <span className="text-sm font-normal text-neutral-500"> / 5</span>
              </p>
              <p className="text-xs text-neutral-500">For 5 questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {Math.ceil((score / 100) * 10)}
                <span className="text-sm font-normal text-neutral-500"> / 10</span>
              </p>
              <p className="text-xs text-neutral-500">For 10 questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-info-light border border-info rounded-lg p-4">
        <h4 className="text-sm font-medium text-info-dark mb-2">
          About Quiz Questions
        </h4>
        <p className="text-sm text-info-dark">
          Quiz questions are managed separately in the{" "}
          <Link href="/admin/onboarding" className="underline hover:no-underline">
            Onboarding Content
          </Link>{" "}
          section. This setting only controls the passing threshold.
        </p>
      </div>

      {updateConfigs.isError && (
        <div className="p-4 bg-error-light border border-error rounded-lg">
          <p className="text-sm text-error-dark">
            Failed to save changes. Please try again.
          </p>
        </div>
      )}

      {updateConfigs.isSuccess && !hasChanges && (
        <div className="p-4 bg-success-light border border-success rounded-lg">
          <p className="text-sm text-success-dark">
            Settings saved successfully!
          </p>
        </div>
      )}
    </div>
  );
}
