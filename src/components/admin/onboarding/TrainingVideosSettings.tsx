"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PlayCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { DurationInput } from "@/components/admin/DurationInput";
import { VimeoVideoPicker } from "@/components/admin/VimeoVideoPicker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useVimeoMetadata, useConfigureVimeoDomains } from "@/hooks/useVimeo";
import { formatDuration, parseVimeoInput } from "@/lib/vimeo";
import type { VimeoVideoMetadata } from "@/lib/vimeo";

interface OnboardingVideo {
  id: string;
  title: string;
  description: string | null;
  vimeoId: string;
  vimeoHash: string | null;
  duration: number;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  thumbnailUrl: string | null;
}

export function TrainingVideosSettings() {
  const router = useRouter();
  const [videos, setVideos] = useState<OnboardingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<OnboardingVideo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vimeoId: "",
    vimeoHash: "",
    duration: 0, // Now stored as seconds
    thumbnailUrl: "",
    order: "0",
    isRequired: true,
  });

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

  const handleFetchFromVimeo = async () => {
    if (!formData.vimeoId) return;

    const result = await fetchMetadata(formData.vimeoId);
    if (result?.metadata) {
      const metadata = result.metadata;
      setFormData((prev) => ({
        ...prev,
        title: prev.title || metadata.name, // Only set if empty
        duration: metadata.duration,
        thumbnailUrl: metadata.thumbnailUrl,
      }));
      setDomainsConfigured(result.allDomainsConfigured);
    }
  };

  const handleConfigureDomains = async () => {
    if (!formData.vimeoId) return;

    const result = await configureDomains(formData.vimeoId);
    if (result) {
      setDomainsConfigured(result.allDomainsConfigured);
    }
  };

  // Parse Vimeo URL or ID from input
  const handleVimeoInput = (input: string) => {
    const parsed = parseVimeoInput(input);
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        vimeoId: parsed.videoId,
        vimeoHash: parsed.hash || prev.vimeoHash,
      }));
    } else {
      // Just set the raw value if we can't parse it
      setFormData((prev) => ({ ...prev, vimeoId: input }));
    }
  };

  // Handle video selection from picker
  const handleVideoSelect = (video: VimeoVideoMetadata) => {
    setFormData((prev) => ({
      ...prev,
      vimeoId: video.id,
      title: prev.title || video.name,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
    }));
    setShowVideoPicker(false);
    // Don't auto-fetch since we already have the data
    setDomainsConfigured(null); // Will check on next fetch
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/admin/onboarding/videos");
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      vimeoId: "",
      vimeoHash: "",
      duration: 0,
      thumbnailUrl: "",
      order: "0",
      isRequired: true,
    });
    setEditingVideo(null);
    setDomainsConfigured(null);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = editingVideo ? "PUT" : "POST";
      const response = await fetch("/api/admin/onboarding/content/videos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingVideo?.id,
          ...formData,
          duration: formData.duration, // Already in seconds
          order: parseInt(formData.order) || 0,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        await fetchVideos();
      }
    } catch (error) {
      console.error("Failed to save video:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/admin/onboarding/content/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchVideos();
    } catch (error) {
      console.error("Failed to delete video:", error);
    } finally {
      setDeleteVideoId(null);
    }
  };

  const openEditModal = (video: OnboardingVideo) => {
    setFormData({
      title: video.title,
      description: video.description || "",
      vimeoId: video.vimeoId,
      vimeoHash: video.vimeoHash || "",
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl || "",
      order: video.order.toString(),
      isRequired: video.isRequired,
    });
    setEditingVideo(video);
    setDomainsConfigured(null);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Training Videos</h3>
          <p className="text-sm text-neutral-600">
            Configure the training videos that onboarding tutors must watch
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-8 text-center">
          <PlayCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600">No training videos added yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Add videos for tutors to watch during onboarding
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-neutral-50 rounded-lg p-4 flex items-center gap-4"
            >
              <Bars3Icon className="h-4 w-4 text-neutral-400 cursor-grab" />
              <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                {video.order + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">
                  {video.title}
                </p>
                <p className="text-sm text-neutral-500">
                  Vimeo: {video.vimeoId} • {formatDuration(video.duration)}
                  {video.isRequired && (
                    <span className="ml-2 text-primary-600">• Required</span>
                  )}
                </p>
              </div>
              {!video.isActive && (
                <span className="text-xs text-neutral-400 px-2 py-1 bg-neutral-200 rounded">
                  Inactive
                </span>
              )}
              <button
                onClick={() => openEditModal(video)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteVideoId(video.id)}
                className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Total Duration */}
      {videos.length > 0 && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>Total training time:</strong>{" "}
            {Math.floor(videos.reduce((acc, v) => acc + v.duration, 0) / 60)} minutes
            ({videos.filter(v => v.isRequired).length} required videos)
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingVideo ? "Edit Video" : "Add Video"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="Orientation Part 1 - Who is Acme Workforce?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Vimeo ID or URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.vimeoId}
                    onChange={(e) => handleVimeoInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    placeholder="Paste URL or video ID"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVideoPicker(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors whitespace-nowrap"
                    title="Browse Vimeo Library"
                  >
                    <FolderOpenIcon className="h-4 w-4" />
                    Browse
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchFromVimeo}
                    disabled={!formData.vimeoId || isFetchingMetadata}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isFetchingMetadata ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    Fetch Info
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Paste a full Vimeo URL (hash will be extracted) or just the video ID
                </p>
                {(fetchError || configError) && (
                  <p className="mt-1 text-xs text-error">
                    {fetchError?.message || configError?.message}
                  </p>
                )}
              </div>

              {/* Privacy Hash (for private/unlisted videos) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Privacy Hash (optional)
                </label>
                <input
                  type="text"
                  value={formData.vimeoHash}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, vimeoHash: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  placeholder="abc123def (from vimeo.com/123456/abc123def)"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Required for private/unlisted videos. Found after the video ID in the URL.
                </p>
              </div>

              {/* Privacy Status */}
              {domainsConfigured !== null && (
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                      domainsConfigured
                        ? "bg-success-light text-success-dark"
                        : "bg-warning-light text-warning-dark"
                    }`}
                  >
                    {domainsConfigured ? (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Embed domains configured
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-3.5 w-3.5" />
                        Embed domains need configuration
                      </>
                    )}
                  </div>
                  {!domainsConfigured && (
                    <button
                      type="button"
                      onClick={handleConfigureDomains}
                      disabled={isConfiguring}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-warning-light text-warning-dark rounded-lg hover:bg-warning-light transition-colors disabled:opacity-50"
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

              <div className="grid grid-cols-2 gap-4">
                <DurationInput
                  value={formData.duration}
                  onChange={(seconds) =>
                    setFormData((prev) => ({ ...prev, duration: seconds }))
                  }
                  label="Duration *"
                  helpText="Format: MM:SS or HH:MM:SS"
                />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isRequired: e.target.checked }))
                  }
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-neutral-700">
                  Required to complete onboarding
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.title || !formData.vimeoId || formData.duration <= 0}
                size="sm"
              >
                {isSaving ? "Saving..." : "Save Video"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video Picker Modal */}
      <VimeoVideoPicker
        isOpen={showVideoPicker}
        onClose={() => setShowVideoPicker(false)}
        onSelect={handleVideoSelect}
        selectedId={formData.vimeoId}
      />

      <ConfirmDialog
        isOpen={deleteVideoId !== null}
        onClose={() => setDeleteVideoId(null)}
        onConfirm={() => deleteVideoId && handleDelete(deleteVideoId)}
        title="Delete Video"
        message="Are you sure you want to delete this video?"
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
