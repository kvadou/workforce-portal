"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  PlayCircleIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useVimeoMetadata, useConfigureVimeoDomains } from "@/hooks/useVimeo";
import { formatDuration } from "@/lib/vimeo";

interface VideoBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

// Extract Vimeo video ID from URL
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  return match ? match[1] : null;
}

interface VideoMetadata {
  title: string;
  duration: number;
  thumbnailUrl: string;
}

export function VideoBlock({ block, isEditing }: VideoBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    url: string;
    provider: "vimeo" | "youtube";
    metadata?: VideoMetadata;
  };
  const [inputUrl, setInputUrl] = useState(content.url || "");
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

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
    setDomainsConfigured(null);
    // Auto-detect provider
    if (url.includes("vimeo.com")) {
      updateBlock(block.id, { url, provider: "vimeo" });
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      updateBlock(block.id, { url, provider: "youtube" });
    } else {
      updateBlock(block.id, { url });
    }
  };

  const handleFetchVimeoMetadata = useCallback(async () => {
    const vimeoId = getVimeoId(content.url);
    if (!vimeoId) return;

    const result = await fetchMetadata(vimeoId);
    if (result?.metadata) {
      updateBlock(block.id, {
        ...content,
        metadata: {
          title: result.metadata.name,
          duration: result.metadata.duration,
          thumbnailUrl: result.metadata.thumbnailUrl,
        },
      });
      setDomainsConfigured(result.allDomainsConfigured);
    }
  }, [content, block.id, updateBlock, fetchMetadata]);

  const handleConfigureDomains = useCallback(async () => {
    const vimeoId = getVimeoId(content.url);
    if (!vimeoId) return;

    const result = await configureDomains(vimeoId);
    if (result) {
      setDomainsConfigured(result.allDomainsConfigured);
    }
  }, [content.url, configureDomains]);

  const videoId =
    content.provider === "vimeo"
      ? getVimeoId(content.url)
      : getYouTubeId(content.url);

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste Vimeo or YouTube URL..."
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          {content.provider === "vimeo" && videoId && (
            <button
              type="button"
              onClick={handleFetchVimeoMetadata}
              disabled={isFetchingMetadata}
              className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isFetchingMetadata ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4" />
              )}
              Fetch Info
            </button>
          )}
        </div>

        {/* Vimeo metadata and privacy status */}
        {content.provider === "vimeo" && videoId && (
          <div className="flex flex-wrap items-center gap-2">
            {content.metadata && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-sm text-neutral-700">
                <span className="font-medium">{content.metadata.title}</span>
                <span className="text-neutral-400">•</span>
                <span>{formatDuration(content.metadata.duration)}</span>
              </div>
            )}

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
          <p className="text-xs text-error">
            {fetchError?.message || configError?.message}
          </p>
        )}

        {videoId ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-neutral-900">
            {content.provider === "vimeo" ? (
              <iframe
                src={`https://player.vimeo.com/video/${videoId}`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div className="aspect-video bg-neutral-100 rounded-lg flex flex-col items-center justify-center text-neutral-400">
            <PlayCircleIcon className="h-12 w-12 mb-2" />
            <p>Enter a video URL above</p>
          </div>
        )}
      </div>
    );
  }

  // View mode
  if (!videoId) return null;

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-neutral-900 my-6">
      {content.provider === "vimeo" ? (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
