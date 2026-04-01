"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  BookOpenIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface CanvaEmbedProps {
  url: string;
  designId?: string;
  height?: string;
  title?: string;
  className?: string;
}

/**
 * Protected Canva Embed Component
 *
 * Canva's embed viewer has two rendering modes:
 * 1. Scrollable document mode — full-width, white bg, content flows naturally
 * 2. Presentation mode — dark bg, page centered as thumbnail with black bars
 *
 * The viewer switches to scrollable mode when the iframe viewport is large enough.
 * We use a very tall iframe (5000px) to ensure Canva always renders in scrollable
 * document mode. The outer page scrolls naturally.
 */
export function CanvaEmbed({
  url,
  designId: _designId,
  height: _height,
  title = "Story Content",
  className = "",
}: CanvaEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure URL has embed parameter
  const embedUrl = url.includes("?embed") ? url : `${url}?embed`;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  if (hasError) {
    return (
      <div className={`rounded-xl border border-neutral-200 bg-neutral-50 ${className}`}>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-14 w-14 rounded-full bg-warning-light flex items-center justify-center mb-4">
            <BookOpenIcon className="h-7 w-7 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            Story Content Unavailable
          </h3>
          <p className="text-neutral-500 max-w-md text-sm leading-relaxed">
            This story is being updated and will be available again soon.
            Your tutor can walk you through this lesson in the meantime.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white shadow-sm">
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="hover:bg-neutral-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-auto bg-white"
            onContextMenu={(e) => e.preventDefault()}
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            <iframe
              src={embedUrl}
              title={title}
              loading="lazy"
              allowFullScreen
              scrolling="no"
              className="w-full border-0 overflow-hidden"
              style={{ height: "5000px" }}
            />
          </div>
        </div>
      )}

      {/* Regular embed view */}
      <div ref={containerRef} className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 rounded-xl z-10 min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
              <p className="text-sm text-neutral-500">Loading story...</p>
            </div>
          </div>
        )}

        {/* Container matches iframe height — only the page scrolls. */}
        <div
          className="relative rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            allowFullScreen
            scrolling="no"
            onLoad={handleLoad}
            onError={handleError}
            className="w-full border-0 overflow-hidden"
            style={{ height: "5000px" }}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white shadow-sm"
          >
            <ArrowsPointingOutIcon className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Type guard to check if content has a Canva embed
 */
export function hasCanvaEmbed(content: unknown): content is { type: 'canva_embed'; canvaEmbed: { url: string; designId?: string; height?: string } } {
  if (!content || typeof content !== 'object') return false;
  const c = content as Record<string, unknown>;
  return c.type === 'canva_embed' && c.canvaEmbed !== null && typeof c.canvaEmbed === 'object';
}
