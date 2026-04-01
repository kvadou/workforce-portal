"use client";

import { useState, useEffect } from "react";
import {
  CheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  EnvelopeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAdminConfigs, useUpdateAdminConfigs } from "@/hooks/useOnboardingConfig";

export function GeneralSettings() {
  const { data: configs, isLoading } = useAdminConfigs("general");
  const updateConfigs = useUpdateAdminConfigs();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (configs) {
      const initial = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);
      setFormData(initial);
    }
  }, [configs]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updates = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
    }));

    await updateConfigs.mutateAsync(updates);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">General Settings</h2>
          <p className="text-sm text-neutral-500">
            Configure completion bonus, training requirements, and contact information
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Bonus */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CurrencyDollarIcon className="h-5 w-5 text-success" />
            <h3 className="font-medium text-neutral-900">Completion Bonus</h3>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
            <input
              type="number"
              value={formData["completion_bonus_amount"] || ""}
              onChange={(e) => handleChange("completion_bonus_amount", e.target.value)}
              className="w-full pl-7 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="250"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Amount paid upon completing all onboarding steps
          </p>
        </div>

        {/* Training Hours */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="h-5 w-5 text-info" />
            <h3 className="font-medium text-neutral-900">Training Video Hours</h3>
          </div>
          <div className="relative">
            <input
              type="text"
              value={formData["training_hours"] || ""}
              onChange={(e) => handleChange("training_hours", e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="2.5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">hours</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Total hours of training video content displayed to users
          </p>
        </div>

        {/* Shadow Lessons */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon className="h-5 w-5 text-primary-600" />
            <h3 className="font-medium text-neutral-900">Shadow Lessons Required</h3>
          </div>
          <input
            type="number"
            value={formData["shadow_lessons_count"] || ""}
            onChange={(e) => handleChange("shadow_lessons_count", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="6"
          />
          <p className="text-xs text-neutral-500 mt-2">
            Number of shadow lessons required to complete onboarding
          </p>
        </div>

        {/* Training Sessions */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon className="h-5 w-5 text-accent-navy" />
            <h3 className="font-medium text-neutral-900">Training Sessions Required</h3>
          </div>
          <input
            type="number"
            value={formData["training_sessions_count"] || ""}
            onChange={(e) => handleChange("training_sessions_count", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="3"
          />
          <p className="text-xs text-neutral-500 mt-2">
            Number of training sessions required before shadow lessons
          </p>
        </div>

        {/* Contact Email */}
        <div className="bg-neutral-50 rounded-lg p-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <EnvelopeIcon className="h-5 w-5 text-warning" />
            <h3 className="font-medium text-neutral-900">Contact Email</h3>
          </div>
          <input
            type="email"
            value={formData["contact_email"] || ""}
            onChange={(e) => handleChange("contact_email", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="admin@workforceportal.com"
          />
          <p className="text-xs text-neutral-500 mt-2">
            Email address shown throughout onboarding for support inquiries
          </p>
        </div>
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
