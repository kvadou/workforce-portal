"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface VideoTranscript {
  id: string;
  moduleId: string;
  content: string;
  segments: TranscriptSegment[] | null;
  language: string;
}

interface TranscriptPanelProps {
  moduleId: string;
  onSeek?: (time: number) => void;
}

async function fetchTranscript(moduleId: string): Promise<VideoTranscript | null> {
  const response = await fetch(`/api/training/modules/${moduleId}/transcript`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch transcript");
  return response.json();
}

export function TranscriptPanel({ moduleId, onSeek }: TranscriptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: transcript, isLoading } = useQuery({
    queryKey: ["transcript", moduleId],
    queryFn: () => fetchTranscript(moduleId),
  });

  const handleCopy = async () => {
    if (transcript?.content) {
      await navigator.clipboard.writeText(transcript.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter segments or content based on search
  const filteredSegments = transcript?.segments?.filter((segment) =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-warning-light rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="h-6 w-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <DocumentTextIcon className="h-12 w-12 text-neutral-200 mx-auto mb-2" />
        <p>No transcript available for this video</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium text-neutral-900">Transcript</span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-neutral-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
        )}
      </div>

      {isExpanded && (
        <>
          {/* Search & Actions */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Copy transcript"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-success" />
              ) : (
                <DocumentDuplicateIcon className="h-4 w-4 text-neutral-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {transcript.segments && transcript.segments.length > 0 ? (
              <div className="space-y-2">
                {(searchQuery ? filteredSegments : transcript.segments)?.map(
                  (segment, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-2 hover:bg-neutral-50 rounded-lg transition-colors group cursor-pointer"
                      onClick={() => onSeek?.(segment.start)}
                    >
                      <span className="text-xs text-primary-500 font-mono whitespace-nowrap group-hover:text-primary-600">
                        {formatTime(segment.start)}
                      </span>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {highlightText(segment.text, searchQuery)}
                      </p>
                    </div>
                  )
                )}
                {searchQuery && filteredSegments?.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No results found for "{searchQuery}"
                  </p>
                )}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {searchQuery
                    ? highlightText(transcript.content, searchQuery)
                    : transcript.content}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
