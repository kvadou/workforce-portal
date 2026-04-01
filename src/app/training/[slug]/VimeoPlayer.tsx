"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Player from "@vimeo/player";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
interface VimeoPlayerProps {
  videoUrl: string;
  initialPosition?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onComplete?: () => void;
}

export default function VimeoPlayer({
  videoUrl,
  initialPosition = 0,
  onProgress,
  onComplete,
}: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastSavedPositionRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResumed, setHasResumed] = useState(false);

  // Extract video ID from URL
  const getVideoId = useCallback((url: string) => {
    // Handle various Vimeo URL formats
    const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    return match ? match[1] : url;
  }, []);

  // Save progress callback
  const saveProgress = useCallback(
    (seconds: number, duration: number) => {
      // Only save every 30 seconds to avoid too many API calls
      if (Math.abs(seconds - lastSavedPositionRef.current) >= 30) {
        lastSavedPositionRef.current = seconds;
        onProgress?.(Math.floor(seconds), Math.floor(duration));
      }
    },
    [onProgress]
  );

  useEffect(() => {
    if (!containerRef.current || !videoUrl) return;

    const videoId = getVideoId(videoUrl);
    if (!videoId) return;
    hasCompletedRef.current = false;
    const emitCompleteOnce = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete?.();
    };

    // Create player
    const player = new Player(containerRef.current, {
      id: parseInt(videoId),
      responsive: true,
      autopause: true,
    });

    playerRef.current = player;

    // Handle player ready
    player.ready().then(() => {
      setIsLoading(false);

      // Resume from last position if available
      if (initialPosition > 0 && !hasResumed) {
        player.setCurrentTime(initialPosition).then(() => {
          setHasResumed(true);
        });
      }
    });

    // Track progress on timeupdate
    player.on("timeupdate", (data) => {
      saveProgress(data.seconds, data.duration);
    });

    // Save progress on pause
    player.on("pause", async () => {
      try {
        const [seconds, duration] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ]);
        onProgress?.(Math.floor(seconds), Math.floor(duration));
      } catch {
        // Player might be destroyed
      }
    });

    // Save progress on seek
    player.on("seeked", async () => {
      try {
        const [seconds, duration] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ]);
        lastSavedPositionRef.current = seconds;
        onProgress?.(Math.floor(seconds), Math.floor(duration));
      } catch {
        // Player might be destroyed
      }
    });

    // Handle video complete (90%+ watched)
    player.on("timeupdate", async (data) => {
      if (data.percent >= 0.9) {
        emitCompleteOnce();
      }
    });

    // Handle video ended
    player.on("ended", () => {
      emitCompleteOnce();
    });

    // Cleanup
    return () => {
      player.destroy().catch(() => {
        // Ignore errors during cleanup
      });
      playerRef.current = null;
    };
  }, [videoUrl, getVideoId, initialPosition, hasResumed, saveProgress, onProgress, onComplete]);

  return (
    <div className="relative aspect-video bg-neutral-900 rounded-xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <ArrowPathIcon className="w-10 h-10 text-white animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
