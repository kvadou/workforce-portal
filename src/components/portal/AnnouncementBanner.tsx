"use client";

import { usePinnedAnnouncements } from "@/hooks/useAnnouncements";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_COLORS,
  AnnouncementType,
} from "@/lib/validations/announcement";
import {
  MapPinIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  StarIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";

const TYPE_ICONS: Record<AnnouncementType, React.ElementType> = {
  IMPORTANT_DATE: CalendarDaysIcon,
  ANNOUNCEMENT: MegaphoneIcon,
  STORY_SPOTLIGHT: StarIcon,
  TUTOR_REVIEW: UsersIcon,
};

export function AnnouncementBanner() {
  const { data: announcements, isLoading } = usePinnedAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (isLoading || !announcements || announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissed.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const Icon = TYPE_ICONS[announcement.type as AnnouncementType];
        const colors = ANNOUNCEMENT_TYPE_COLORS[announcement.type as AnnouncementType];

        return (
          <div
            key={announcement.id}
            className={`relative flex items-start gap-4 p-4 rounded-[var(--radius-lg)] ${colors.bg} border border-${colors.text.replace("text-", "")}/20`}
          >
            <div
              className={`h-10 w-10 rounded-[var(--radius-md)] bg-white/80 flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPinIcon className={`h-4 w-4 ${colors.text}`} />
                <span className={`text-caption font-medium ${colors.text}`}>
                  {ANNOUNCEMENT_TYPE_LABELS[announcement.type as AnnouncementType]}
                </span>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                {announcement.title}
              </h3>
              <p className="text-body-sm text-neutral-700 line-clamp-2">
                {announcement.content}
              </p>
              {announcement.linkUrl && (
                <Link
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 mt-2 text-body-sm font-medium ${colors.text} hover:underline`}
                >
                  {announcement.linkText || "Learn More"}
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              onClick={() => setDismissed([...dismissed, announcement.id])}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
