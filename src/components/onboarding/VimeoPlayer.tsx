"use client";

import { useEffect, useRef, useCallback } from "react";

interface VimeoPlayerProps {
  vimeoId: string;
  hash?: string; // Required for unlisted/private videos
  title: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLIFrameElement, options?: Record<string, unknown>) => VimeoPlayerInstance;
    };
  }
}

interface VimeoPlayerInstance {
  on: (event: string, callback: (data: { percent?: number; seconds?: number; duration?: number }) => void) => void;
  off: (event: string) => void;
  destroy: () => void;
  getDuration: () => Promise<number>;
  getCurrentTime: () => Promise<number>;
}

export function VimeoPlayer({
  vimeoId,
  hash,
  title,
  onProgress,
  onComplete,
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayerInstance | null>(null);
  const lastReportedProgress = useRef<number>(0);

  const handleTimeUpdate = useCallback(
    (data: { percent?: number }) => {
      if (!data.percent) return;
      const percent = Math.round(data.percent * 100);

      // Only report progress every 5% to avoid too many API calls
      if (percent >= lastReportedProgress.current + 5 || percent >= 90) {
        lastReportedProgress.current = percent;
        onProgress?.(percent);
      }
    },
    [onProgress]
  );

  const handleEnded = useCallback(() => {
    onComplete?.();
    onProgress?.(100);
  }, [onComplete, onProgress]);

  useEffect(() => {
    // Reset progress tracking when video changes
    lastReportedProgress.current = 0;

    // Load Vimeo Player API
    const loadVimeoAPI = () => {
      return new Promise<void>((resolve) => {
        if (window.Vimeo) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://player.vimeo.com/api/player.js";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    };

    const initPlayer = async () => {
      await loadVimeoAPI();

      if (!iframeRef.current || !window.Vimeo) return;

      // Destroy previous player if exists
      if (playerRef.current) {
        try {
          playerRef.current.off("timeupdate");
          playerRef.current.off("ended");
        } catch {
          // Player might already be destroyed
        }
      }

      const player = new window.Vimeo.Player(iframeRef.current);
      playerRef.current = player;

      player.on("timeupdate", handleTimeUpdate);
      player.on("ended", handleEnded);
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.off("timeupdate");
          playerRef.current.off("ended");
        } catch {
          // Player might already be destroyed
        }
      }
    };
  }, [vimeoId, hash, handleTimeUpdate, handleEnded]);

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?${hash ? `h=${hash}&` : ''}title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        title={title}
        className="absolute top-0 left-0 w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  );
}
