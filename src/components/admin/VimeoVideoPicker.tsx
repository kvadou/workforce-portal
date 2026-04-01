"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useVimeoVideos } from "@/hooks/useVimeo";
import { formatDuration } from "@/lib/vimeo";
import type { VimeoVideoMetadata } from "@/lib/vimeo";

interface VimeoVideoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (video: VimeoVideoMetadata) => void;
  selectedId?: string;
}

/**
 * Modal component to browse and select videos from the user's Vimeo library
 */
export function VimeoVideoPicker({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: VimeoVideoPickerProps) {
  const {
    videos,
    total,
    page,
    totalPages,
    isLoading,
    error,
    query,
    setQuery,
    goToPage,
  } = useVimeoVideos();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Select from Vimeo Library
            </h2>
            <p className="text-sm text-neutral-500">
              {total > 0 ? `${total} videos available` : "Loading..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <PlayCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">{error.message}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <PlayCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">
                {query ? "No videos match your search" : "No videos found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => onSelect(video)}
                  className={`text-left rounded-lg overflow-hidden border-2 transition-all hover:shadow-sm ${
                    selectedId === video.id
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  <div className="relative aspect-video bg-neutral-100">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircleIcon className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/75 text-white text-xs rounded">
                      {formatDuration(video.duration)}
                    </div>
                    {/* Selected indicator */}
                    {selectedId === video.id && (
                      <div className="absolute top-2 right-2 h-6 w-6 bg-primary-500 rounded-lg flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-neutral-900 text-sm line-clamp-2">
                      {video.name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      ID: {video.id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-neutral-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
