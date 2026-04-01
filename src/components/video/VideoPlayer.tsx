"use client";

import { useState, useRef, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  BackwardIcon,
  ForwardIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { IconButton } from "@/components/ui/icon-button";

interface VideoPlayerProps {
  url?: string;
  title?: string;
  thumbnail?: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onComplete?: () => void;
  onStart?: () => void;
  autoPlay?: boolean;
}

// Extract video ID and platform from URL
function parseVideoUrl(url: string): { platform: "vimeo" | "youtube" | "unknown"; id: string } {
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return { platform: "vimeo", id: vimeoMatch[1] };
  }

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { platform: "youtube", id: youtubeMatch[1] };
  }

  return { platform: "unknown", id: "" };
}

export function VideoPlayer({
  url,
  title,
  thumbnail,
  onProgress,
  onComplete,
  onStart,
  autoPlay = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoInfo = url ? parseVideoUrl(url) : null;

  // Generate embed URL
  const getEmbedUrl = () => {
    if (!videoInfo || videoInfo.platform === "unknown") return null;

    if (videoInfo.platform === "vimeo") {
      return `https://player.vimeo.com/video/${videoInfo.id}?autoplay=${autoPlay ? 1 : 0}&muted=${isMuted ? 1 : 0}&title=0&byline=0&portrait=0`;
    }

    if (videoInfo.platform === "youtube") {
      return `https://www.youtube.com/embed/${videoInfo.id}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  // Handle iframe load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Handle play button click (for placeholder state)
  const handlePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      onStart?.();
    }
    setIsPlaying(true);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // No video URL provided
  if (!url) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayIcon className="h-8 w-8 ml-1" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title || "Video"}</h3>
          <p className="text-sm text-white/60">No video URL provided</p>
        </div>
      </div>
    );
  }

  // Unknown video platform
  if (videoInfo?.platform === "unknown") {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayIcon className="h-8 w-8 ml-1" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title || "Video"}</h3>
          <p className="text-sm text-white/60">
            Unsupported video format. Please use YouTube or Vimeo.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            Open Video Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Thumbnail / Placeholder */}
      {!hasStarted && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-navy flex items-center justify-center cursor-pointer z-10"
          onClick={handlePlay}
        >
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="relative text-center text-white p-8">
            <button className="h-20 w-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 transition-all hover:scale-110 shadow-sm">
              <PlayIcon className="h-10 w-10 ml-1" />
            </button>
            {title && <h3 className="text-xl font-semibold">{title}</h3>}
            <p className="text-sm text-white/70 mt-2">Click to play</p>
          </div>
        </div>
      )}

      {/* Video iframe */}
      {hasStarted && embedUrl && (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-5">
              <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
          />
        </>
      )}

      {/* Custom Controls Overlay (optional enhancement) */}
      {hasStarted && showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity">
          <div className="flex items-center gap-4 text-white">
            {/* Progress bar */}
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <IconButton
                icon={isMuted ? SpeakerXMarkIcon : SpeakerWaveIcon}
                size="sm"
                aria-label={isMuted ? "Unmute" : "Mute"}
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20 hover:text-white"
              />
              <IconButton
                icon={ArrowsPointingOutIcon}
                size="sm"
                aria-label="Toggle fullscreen"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 hover:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Platform badge */}
      {videoInfo && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-xs text-white/70 capitalize">
          {videoInfo.platform}
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
