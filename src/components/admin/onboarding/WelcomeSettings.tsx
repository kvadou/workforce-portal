"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAdminConfigs, useUpdateAdminConfigs } from "@/hooks/useOnboardingConfig";
import { VimeoVideoInput } from "./VimeoVideoInput";
import { VimeoVideoPicker } from "@/components/admin/VimeoVideoPicker";
import { useVimeoMetadata, useConfigureVimeoDomains } from "@/hooks/useVimeo";
import type { VimeoVideoMetadata } from "@/lib/vimeo";

// Vimeo logo icon component
function VimeoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
    </svg>
  );
}

export function WelcomeSettings() {
  const { data: configs, isLoading } = useAdminConfigs("welcome");
  const updateConfigs = useUpdateAdminConfigs();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [domainsConfigured, setDomainsConfigured] = useState<boolean | null>(null);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  const {
    isLoading: isFetchingMetadata,
    error: fetchError,
    fetchMetadata,
  } = useVimeoMetadata();

  const {
    isConfiguring,
    error: configError,
    configureDomains,
  } = useConfigureVimeoDomains();

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

  const handleFetchFromVimeo = useCallback(async () => {
    const videoId = formData["welcome_video_id"];
    if (!videoId) return;

    const result = await fetchMetadata(videoId);
    if (result?.metadata) {
      // Auto-populate title if empty
      if (!formData["welcome_video_title"]) {
        handleChange("welcome_video_title", result.metadata.name);
      }
      setDomainsConfigured(result.allDomainsConfigured);
    }
  }, [formData, fetchMetadata]);

  const handleConfigureDomains = useCallback(async () => {
    const videoId = formData["welcome_video_id"];
    if (!videoId) return;

    const result = await configureDomains(videoId);
    if (result) {
      setDomainsConfigured(result.allDomainsConfigured);
    }
  }, [formData, configureDomains]);

  // Handle video selection from picker
  const handleVideoSelect = (video: VimeoVideoMetadata) => {
    handleChange("welcome_video_id", video.id);
    // Auto-populate title if empty
    if (!formData["welcome_video_title"]) {
      handleChange("welcome_video_title", video.name);
    }
    setShowVideoPicker(false);
    setDomainsConfigured(null); // Will check on next fetch
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
          <h2 className="text-lg font-semibold text-neutral-900">Welcome Page Settings</h2>
          <p className="text-sm text-neutral-500">
            Configure the welcome video and messaging for new tutors
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

      {/* Video Configuration */}
      <div className="bg-neutral-50 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-900">Welcome Video</h3>
          <button
            type="button"
            onClick={() => setShowVideoPicker(true)}
            className="flex items-center gap-2 px-3 py-2 bg-accent-cyan text-white rounded-lg hover:bg-info-dark transition-colors text-sm font-medium"
            title="Browse Vimeo Library"
          >
            <VimeoIcon className="h-4 w-4" />
            Vimeo
          </button>
        </div>
        <VimeoVideoInput
          videoId={formData["welcome_video_id"] || ""}
          videoHash={formData["welcome_video_hash"] || ""}
          onVideoIdChange={(id) => handleChange("welcome_video_id", id)}
          onVideoHashChange={(hash) => handleChange("welcome_video_hash", hash)}
          showFetchButton={false}
        />

        {/* Fetch from Vimeo Button */}
        {formData["welcome_video_id"] && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleFetchFromVimeo}
              disabled={!formData["welcome_video_id"] || isFetchingMetadata}
              className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingMetadata ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Fetch Info from Vimeo
                </>
              )}
            </button>

            {/* Privacy Status */}
            {domainsConfigured !== null && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${
                  domainsConfigured
                    ? "bg-success-light text-success-dark"
                    : "bg-warning-light text-warning-dark"
                }`}
              >
                {domainsConfigured ? (
                  <>
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Embed configured
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                    Needs embed config
                  </>
                )}
              </div>
            )}

            {/* Configure Domains Button */}
            {domainsConfigured === false && (
              <button
                type="button"
                onClick={handleConfigureDomains}
                disabled={isConfiguring}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-warning-light text-warning-dark rounded-lg hover:bg-warning-light transition-colors disabled:opacity-50"
              >
                {isConfiguring ? (
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                )}
                Configure
              </button>
            )}
          </div>
        )}

        {(fetchError || configError) && (
          <p className="mt-2 text-xs text-error">
            {fetchError?.message || configError?.message}
          </p>
        )}
      </div>

      {/* Video Title & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Video Title
          </label>
          <input
            type="text"
            value={formData["welcome_video_title"] || ""}
            onChange={(e) => handleChange("welcome_video_title", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="A Message From Harlan"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Displayed above the video player
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Welcome Headline
          </label>
          <input
            type="text"
            value={formData["welcome_headline"] || ""}
            onChange={(e) => handleChange("welcome_headline", e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            placeholder="We're thrilled to have you join..."
          />
          <p className="text-xs text-neutral-500 mt-1">
            Main headline shown on the welcome page
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Video Description
        </label>
        <textarea
          value={formData["welcome_video_description"] || ""}
          onChange={(e) => handleChange("welcome_video_description", e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          placeholder="Learn what makes Acme Workforce special..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Shown below the video title to explain the content
        </p>
      </div>

      {/* Preview Section */}
      <div className="bg-info-light border border-info rounded-lg p-4">
        <h4 className="text-sm font-medium text-info-dark mb-2">Preview</h4>
        <p className="text-sm text-info-dark">
          The welcome page shows new tutors a personalized greeting with the video and these messages.
          The stats section ($250 bonus, training hours, shadow lessons) is configured in General Settings.
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

      {/* Video Picker Modal */}
      <VimeoVideoPicker
        isOpen={showVideoPicker}
        onClose={() => setShowVideoPicker(false)}
        onSelect={handleVideoSelect}
        selectedId={formData["welcome_video_id"]}
      />
    </div>
  );
}
