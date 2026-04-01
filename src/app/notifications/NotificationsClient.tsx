"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  Notification,
} from "@/hooks/useNotifications";
import { NotificationType } from "@prisma/client";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  BoltIcon,
  BookOpenIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  FunnelIcon,
  InboxIcon,
  MapIcon,
  MegaphoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  TrashIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
const iconMap: Record<NotificationType, React.ElementType> = {
  BADGE_EARNED: TrophyIcon,
  MILESTONE_REACHED: FlagIcon,
  COURSE_COMPLETED: BookOpenIcon,
  PATH_COMPLETED: MapIcon,
  ANNOUNCEMENT: MegaphoneIcon,
  CERTIFICATION: ShieldCheckIcon,
  ENGAGEMENT_ALERT: ExclamationTriangleIcon,
  SYSTEM: BellIcon,
  SESSION_REMINDER: PlayIcon,
  POINTS_MILESTONE: BoltIcon,
  LEADERBOARD_CHANGE: ArrowTrendingUpIcon,
  PUZZLE_MILESTONE: TrophyIcon,
};

const bgColorMap: Record<NotificationType, string> = {
  BADGE_EARNED: "bg-warning-light border-warning",
  MILESTONE_REACHED: "bg-success-light border-success",
  COURSE_COMPLETED: "bg-info-light border-info",
  PATH_COMPLETED: "bg-accent-navy-light border-accent-navy",
  ANNOUNCEMENT: "bg-primary-50 border-primary-200",
  CERTIFICATION: "bg-primary-50 border-primary-200",
  ENGAGEMENT_ALERT: "bg-accent-orange-light border-accent-orange",
  SYSTEM: "bg-neutral-50 border-neutral-200",
  SESSION_REMINDER: "bg-info-light border-info",
  POINTS_MILESTONE: "bg-warning-light border-warning",
  LEADERBOARD_CHANGE: "bg-error-light border-error",
  PUZZLE_MILESTONE: "bg-success-light border-success",
};

const iconColorMap: Record<NotificationType, string> = {
  BADGE_EARNED: "text-warning bg-warning-light",
  MILESTONE_REACHED: "text-success bg-success-light",
  COURSE_COMPLETED: "text-info bg-info-light",
  PATH_COMPLETED: "text-accent-navy bg-accent-navy-light",
  ANNOUNCEMENT: "text-primary-500 bg-primary-100",
  CERTIFICATION: "text-primary-500 bg-primary-100",
  ENGAGEMENT_ALERT: "text-accent-orange bg-accent-orange-light",
  SYSTEM: "text-neutral-500 bg-neutral-100",
  SESSION_REMINDER: "text-info bg-info-light",
  POINTS_MILESTONE: "text-warning bg-warning-light",
  LEADERBOARD_CHANGE: "text-error bg-error-light",
  PUZZLE_MILESTONE: "text-success bg-success-light",
};

const typeLabels: Record<NotificationType, string> = {
  BADGE_EARNED: "Badges",
  MILESTONE_REACHED: "Milestones",
  COURSE_COMPLETED: "Courses",
  PATH_COMPLETED: "Paths",
  ANNOUNCEMENT: "Announcements",
  CERTIFICATION: "Certifications",
  ENGAGEMENT_ALERT: "Alerts",
  SYSTEM: "System",
  SESSION_REMINDER: "Sessions",
  POINTS_MILESTONE: "Points",
  LEADERBOARD_CHANGE: "Leaderboard",
  PUZZLE_MILESTONE: "Puzzles",
};

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = iconMap[notification.type] || BellIcon;
  const bgColor = bgColorMap[notification.type] || bgColorMap.SYSTEM;
  const iconColor = iconColorMap[notification.type] || iconColorMap.SYSTEM;

  const content = (
    <Card className={`border-2 transition-all hover:shadow-sm ${notification.isRead ? "opacity-60" : ""} ${bgColor}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-semibold ${notification.isRead ? "text-neutral-600" : "text-neutral-900"}`}>
                  {notification.title}
                </h3>
                {notification.message && (
                  <p className="text-sm text-neutral-500 mt-1">{notification.message}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMarkRead(notification.id);
                    }}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4 text-neutral-400 hover:text-success" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4 text-neutral-400 hover:text-error" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-neutral-400">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              {!notification.isRead && (
                <span className="px-2.5 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                  New
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationsClient() {
  const [filterType, setFilterType] = useState<NotificationType | "ALL">("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading, error } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "ALL" && n.type !== filterType) return false;
    if (showUnreadOnly && n.isRead) return false;
    return true;
  });

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
    if (!groups[date]) groups[date] = [];
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const handleMarkRead = (id: string) => markAsRead.mutate(id);
  const handleDelete = (id: string) => deleteNotification.mutate(id);
  const handleMarkAllRead = () => markAllAsRead.mutate();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-error bg-error-light">
          <CardContent className="py-8 text-center text-error-dark">
            Failed to load notifications. Please try again.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Page Title */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckIcon className="w-4 h-4 mr-1.5" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <div className="px-5 sm:px-6 py-5 sm:py-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-500">FunnelIcon:</span>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as NotificationType | "ALL")}
              className="px-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Types</option>
              {Object.entries(typeLabels).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-4 py-2.5 text-sm font-medium border rounded-xl transition-colors min-h-[44px] ${
                showUnreadOnly
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:bg-neutral-100"
              }`}
            >
              Unread only
            </button>

            {(filterType !== "ALL" || showUnreadOnly) && (
              <button
                onClick={() => {
                  setFilterType("ALL");
                  setShowUnreadOnly(false);
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              <InboxIcon className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {showUnreadOnly || filterType !== "ALL"
                ? "No notifications match your filters"
                : "No notifications yet"}
            </h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {showUnreadOnly || filterType !== "ALL"
                ? "Try adjusting your filters to see more"
                : "When you earn badges, complete courses, or receive announcements, they'll appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, notifs]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h2>
                <div className="space-y-3">
                  {notifs.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      </div>
      </div>
    </DashboardLayout>
  );
}
