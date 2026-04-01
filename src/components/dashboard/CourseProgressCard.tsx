"use client";

import Link from "next/link";
import {
  BookOpenIcon,
  ClockIcon,
  BoltIcon,
  ChevronRightIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface CourseProgressCardProps {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progress: number;
  timeRemaining?: string;
  pointsAvailable?: number;
  compact?: boolean;
}

export function CourseProgressCard({
  title,
  slug,
  thumbnailUrl,
  progress,
  timeRemaining,
  pointsAvailable,
  compact = false,
}: CourseProgressCardProps) {
  if (compact) {
    return (
      <Link href={`/training/${slug}`}>
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
          <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpenIcon className="h-5 w-5 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warning to-accent-orange rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600">{progress}%</span>
            </div>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/training/${slug}`}>
      <div className="group relative bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-card-hover hover:border-primary-200 transition-all">
        {/* Thumbnail */}
        <div className="relative h-32 bg-gradient-to-br from-neutral-100 to-neutral-50 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpenIcon className="h-12 w-12 text-neutral-300" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="h-12 w-12 rounded-lg bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <PlayIcon className="h-5 w-5 text-primary-600 ml-0.5" />
            </div>
          </div>

          {/* Progress badge */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-white">{progress}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          {/* Progress bar */}
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs">
            {timeRemaining && (
              <div className="flex items-center gap-1 text-neutral-500">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{timeRemaining} left</span>
              </div>
            )}
            {pointsAvailable && pointsAvailable > 0 && (
              <div className="flex items-center gap-1 text-warning bg-warning-light px-2 py-1 rounded-full">
                <BoltIcon className="h-3.5 w-3.5" />
                <span className="font-medium">+{pointsAvailable} pts</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
