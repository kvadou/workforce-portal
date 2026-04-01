"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckIcon,
  ArrowPathIcon,
  TrophyIcon,
  FlagIcon,
  BookOpenIcon,
  MapPinIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  Notification,
} from "@/hooks/useNotifications";
import { NotificationType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

// Icon map for notification types
const iconMap: Record<NotificationType, React.ElementType> = {
  BADGE_EARNED: TrophyIcon,
  MILESTONE_REACHED: FlagIcon,
  COURSE_COMPLETED: BookOpenIcon,
  PATH_COMPLETED: MapPinIcon,
  ANNOUNCEMENT: MegaphoneIcon,
  CERTIFICATION: ShieldCheckIcon,
  ENGAGEMENT_ALERT: ExclamationTriangleIcon,
  SYSTEM: BellIcon,
  SESSION_REMINDER: PlayCircleIcon,
  POINTS_MILESTONE: BoltIcon,
  LEADERBOARD_CHANGE: ArrowTrendingUpIcon,
  PUZZLE_MILESTONE: TrophyIcon,
};

// Color map for notification types
const colorMap: Record<NotificationType, string> = {
  BADGE_EARNED: "text-warning bg-warning-light",
  MILESTONE_REACHED: "text-success bg-success-light",
  COURSE_COMPLETED: "text-info bg-info-light",
  PATH_COMPLETED: "text-accent-navy bg-accent-navy-light",
  ANNOUNCEMENT: "text-primary-500 bg-primary-50",
  CERTIFICATION: "text-primary-500 bg-primary-50",
  ENGAGEMENT_ALERT: "text-accent-orange bg-accent-orange-light",
  SYSTEM: "text-neutral-500 bg-neutral-50",
  SESSION_REMINDER: "text-info bg-info-light",
  POINTS_MILESTONE: "text-warning bg-warning-light",
  LEADERBOARD_CHANGE: "text-error bg-error-light",
  PUZZLE_MILESTONE: "text-success bg-success-light",
};

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = iconMap[notification.type] || BellIcon;
  const colorClass = colorMap[notification.type] || "text-neutral-500 bg-neutral-50";

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  const content = (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-neutral-50 transition-colors cursor-pointer ${
        notification.isRead ? "opacity-60" : ""
      }`}
      onClick={handleClick}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? "text-neutral-600" : "text-neutral-900 font-medium"}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-neutral-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
      )}
    </div>
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error text-white text-xs font-bold rounded-lg flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[var(--radius-lg)] shadow-dropdown border border-neutral-200 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                {markAllAsRead.isPending ? (
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckIcon className="h-3 w-3" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-6 w-6 text-primary-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <BellIcon className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-neutral-100 p-2">
              <Link href="/notifications" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
