"use client";

import { useRecentAnnouncements } from "@/hooks/useAnnouncements";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_COLORS,
  AnnouncementType,
} from "@/lib/validations/announcement";
import {
  CalendarDaysIcon,
  MegaphoneIcon,
  StarIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { format } from "date-fns";

const TYPE_ICONS: Record<AnnouncementType, React.ElementType> = {
  IMPORTANT_DATE: CalendarDaysIcon,
  ANNOUNCEMENT: MegaphoneIcon,
  STORY_SPOTLIGHT: StarIcon,
  TUTOR_REVIEW: UsersIcon,
};

interface AnnouncementFeedProps {
  limit?: number;
  showHeader?: boolean;
}

export function AnnouncementFeed({ limit = 5, showHeader = true }: AnnouncementFeedProps) {
  const { data: announcements, isLoading } = useRecentAnnouncements(limit);

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <h3 className="font-semibold text-neutral-900">Announcements</h3>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-500" />
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <h3 className="font-semibold text-neutral-900">Announcements</h3>
          </CardHeader>
        )}
        <CardContent className="text-center py-8">
          <MegaphoneIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-body-sm text-neutral-500">No announcements</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <h3 className="font-semibold text-neutral-900">Announcements</h3>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {announcements.map((announcement) => {
          const Icon = TYPE_ICONS[announcement.type as AnnouncementType];
          const colors = ANNOUNCEMENT_TYPE_COLORS[announcement.type as AnnouncementType];

          return (
            <div
              key={announcement.id}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div
                className={`h-8 w-8 rounded-[var(--radius-md)] ${colors.bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`h-4 w-4 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-caption font-medium ${colors.text}`}>
                    {ANNOUNCEMENT_TYPE_LABELS[announcement.type as AnnouncementType]}
                  </span>
                  {announcement.isPinned && (
                    <MapPinIcon className="h-3 w-3 text-primary-500" />
                  )}
                  <span className="text-caption text-neutral-400">
                    {format(new Date(announcement.publishDate), "MMM d")}
                  </span>
                </div>
                <h4 className="font-medium text-neutral-900 text-body-sm mb-1 line-clamp-1">
                  {announcement.title}
                </h4>
                <p className="text-body-sm text-neutral-600 line-clamp-2">
                  {announcement.content}
                </p>
                {announcement.linkUrl && (
                  <Link
                    href={announcement.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-caption font-medium text-primary-500 hover:underline"
                  >
                    {announcement.linkText || "Learn More"}
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
