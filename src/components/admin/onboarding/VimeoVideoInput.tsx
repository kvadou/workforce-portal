"use client";

import { useState, useCallback } from "react";
import {
  PlayCircleIcon,
  PlayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useVimeoMetadata, useConfigureVimeoDomains } from "@/hooks/useVimeo";
import { formatDuration } from "@/lib/vimeo";

interface VimeoVideoMetadata {
  title: string;
  duration: number;
  thumbnailUrl: string;
}

interface VimeoVideoInputProps {
  videoId: string;
  videoHash?: string;
  onVideoIdChange: (id: string) => void;
  onVideoHashChange?: (hash: string) => void;
  /** Callback when metadata is fetched from Vimeo API */
  onMetadataFetched?: (metadata: VimeoVideoMetadata) => void;
  /** Whether to auto-configure privacy/embed domains */
  autoConfigurePrivacy?: boolean;
  label?: string;
  showPreview?: boolean;
  /** Show the fetch metadata button */
  showFetchButton?: boolean;
}

export function VimeoVideoInput({
  videoId,
  videoHash = "",
  onVideoIdChange,
  onVideoHashChange,
  onMetadataFetched,
  autoConfigurePrivacy = false,
  label,
  showPreview = true,
  showFetchButton = true,
}: VimeoVideoInputProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedMetadata, setFetchedMetadata] = useState<VimeoVideoMetadata | null>(null);
  const [domainsConfigured, setDomainsConfigured] = useState<boolean | null>(null);

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

  const handleConfigureDomains = useCallback(async () => {
    if (!videoId) return;

    const result = await configureDomains(videoId);
    if (result) {
      setDomainsConfigured(result.allDomainsConfigured);
    }
  }, [videoId, configureDomains]);

  const handleFetchMetadata = useCallback(async () => {
    if (!videoId) {
      setError("Please enter a Vimeo video ID first");
      return;
    }

    setError(null);
    const result = await fetchMetadata(videoId);

    if (result?.metadata) {
      const meta: VimeoVideoMetadata = {
        title: result.metadata.name,
        duration: result.metadata.duration,
        thumbnailUrl: result.metadata.thumbnailUrl,
      };
      setFetchedMetadata(meta);
      setDomainsConfigured(result.allDomainsConfigured);
      onMetadataFetched?.(meta);

      // Auto-configure privacy if enabled and domains are missing
      if (autoConfigurePrivacy && !result.allDomainsConfigured) {
        await handleConfigureDomains();
      }
    }
  }, [videoId, fetchMetadata, onMetadataFetched, autoConfigurePrivacy, handleConfigureDomains]);

  const getVimeoUrl = useCallback(() => {
    if (!videoId) return "";
    let url = `https://player.vimeo.com/video/${videoId}`;
    if (videoHash) {
      url += `?h=${videoHash}`;
    }
    return url;
  }, [videoId, videoHash]);

  const handlePreviewClick = () => {
    if (!videoId) {
      setError("Please enter a Vimeo video ID");
      return;
    }
    setError(null);
    setShowPlayer(true);
  };

  const parseVimeoUrl = (input: string) => {
    // Reset error
    setError(null);

    // Handle direct ID input (just numbers)
    if (/^\d+$/.test(input.trim())) {
      onVideoIdChange(input.trim());
      return;
    }

    // Handle full Vimeo URLs
    // Examples:
    // https://vimeo.com/838377574/09dc5d426b
    // https://vimeo.com/838377574
    // https://player.vimeo.com/video/838377574?h=09dc5d426b
    try {
      const url = new URL(input);

      if (url.hostname.includes("vimeo.com")) {
        // Extract video ID from path
        const pathParts = url.pathname.split("/").filter(Boolean);

        // Find the numeric part (video ID)
        const numericPart = pathParts.find((part) => /^\d+$/.test(part));
        if (numericPart) {
          onVideoIdChange(numericPart);

          // Look for hash in path (e.g., /838377574/09dc5d426b)
          const idIndex = pathParts.indexOf(numericPart);
          if (idIndex < pathParts.length - 1) {
            const possibleHash = pathParts[idIndex + 1];
            if (/^[a-f0-9]+$/i.test(possibleHash) && onVideoHashChange) {
              onVideoHashChange(possibleHash);
            }
          }

          // Look for hash in query params (e.g., ?h=09dc5d426b)
          const hashParam = url.searchParams.get("h");
          if (hashParam && onVideoHashChange) {
            onVideoHashChange(hashParam);
          }
        } else {
          setError("Could not find video ID in URL");
        }
      } else {
        setError("Please enter a valid Vimeo URL or video ID");
      }
    } catch {
      // If it's not a valid URL and not just numbers, show error
      if (input.trim()) {
        setError("Please enter a valid Vimeo URL or video ID");
      }
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}

      <div className="flex gap-3">
        {/* Video ID Input */}
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">
            Video ID or URL
          </label>
          <div className="relative">
            <PlayCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={videoId}
              onChange={(e) => parseVimeoUrl(e.target.value)}
              placeholder="e.g., 838377574 or paste Vimeo URL"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Hash Input (optional) */}
        {onVideoHashChange && (
          <div className="w-40">
            <label className="block text-xs text-neutral-500 mb-1">
              Privacy Hash
            </label>
            <input
              type="text"
              value={videoHash}
              onChange={(e) => onVideoHashChange(e.target.value)}
              placeholder="e.g., 09dc5d426b"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
            />
          </div>
        )}
      </div>

      {/* Fetch Metadata Button */}
      {showFetchButton && videoId && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchMetadata}
            disabled={isFetchingMetadata || !videoId}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingMetadata ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4" />
                Fetch from Vimeo
              </>
            )}
          </button>

          {/* Privacy Status */}
          {domainsConfigured !== null && (
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

          {/* Configure Domains Button (when needed) */}
          {domainsConfigured === false && (
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

      {/* Fetched Metadata Display */}
      {fetchedMetadata && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div className="flex items-start gap-3">
            {fetchedMetadata.thumbnailUrl && (
              <img
                src={fetchedMetadata.thumbnailUrl}
                alt="Video thumbnail"
                className="h-14 w-24 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">
                {fetchedMetadata.title}
              </p>
              <p className="text-sm text-neutral-600">
                Duration: {formatDuration(fetchedMetadata.duration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || fetchError || configError) && (
        <div className="flex items-center gap-2 text-sm text-error">
          <ExclamationCircleIcon className="h-4 w-4" />
          {error || fetchError?.message || configError?.message}
        </div>
      )}

      {/* Preview Section */}
      {showPreview && videoId && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Preview</span>
            <div className="flex gap-2">
              {showPlayer && (
                <button
                  type="button"
                  onClick={() => setShowPlayer(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                >
                  <ArrowPathIcon className="h-3 w-3" />
                  Reset
                </button>
              )}
              <a
                href={`https://vimeo.com/${videoId}${videoHash ? `/${videoHash}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                Open in Vimeo
              </a>
            </div>
          </div>

          <div className="relative aspect-video bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
            {showPlayer ? (
              <iframe
                src={getVimeoUrl()}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Video preview"
              />
            ) : (
              <button
                type="button"
                onClick={handlePreviewClick}
                className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors group"
              >
                <div className="h-16 w-16 bg-neutral-200 rounded-lg flex items-center justify-center mb-3 group-hover:bg-neutral-300 transition-colors">
                  <PlayIcon className="h-8 w-8 ml-1" />
                </div>
                <span className="text-sm">Click to preview</span>
                <span className="text-xs text-neutral-400 mt-1">
                  ID: {videoId}
                  {videoHash && ` • Hash: ${videoHash}`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-neutral-500">
        You can paste a full Vimeo URL (e.g., https://vimeo.com/123456789/abcdef123)
        or just enter the video ID. For private videos, you may need the privacy hash.
      </p>
    </div>
  );
}
