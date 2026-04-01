"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationType } from "@prisma/client";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Fetch notifications
async function fetchNotifications(unreadOnly = false): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("unreadOnly", "true");

  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

// Mark single notification as read
async function markAsRead(id: string): Promise<Notification> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return res.json();
}

// Mark all notifications as read
async function markAllAsRead(): Promise<{ success: boolean; count: number }> {
  const res = await fetch("/api/notifications/read-all", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to mark all as read");
  return res.json();
}

// Delete notification
async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete notification");
}

// Hook: Get notifications
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () => fetchNotifications(unreadOnly),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

// Hook: Get unread count only (lightweight)
export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.unreadCount ?? 0;
}

// Hook: Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Hook: Mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Hook: Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Helper: Get icon for notification type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "BADGE_EARNED":
      return "award";
    case "MILESTONE_REACHED":
      return "target";
    case "COURSE_COMPLETED":
      return "book-open";
    case "PATH_COMPLETED":
      return "route";
    case "ANNOUNCEMENT":
      return "megaphone";
    case "CERTIFICATION":
      return "shield-check";
    case "ENGAGEMENT_ALERT":
      return "alert-triangle";
    case "SYSTEM":
    default:
      return "bell";
  }
}

// Helper: Get color for notification type
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "BADGE_EARNED":
      return "text-warning";
    case "MILESTONE_REACHED":
      return "text-success";
    case "COURSE_COMPLETED":
      return "text-info";
    case "PATH_COMPLETED":
      return "text-accent-navy";
    case "ANNOUNCEMENT":
      return "text-primary-500";
    case "CERTIFICATION":
      return "text-primary-500";
    case "ENGAGEMENT_ALERT":
      return "text-accent-orange";
    case "SYSTEM":
    default:
      return "text-neutral-500";
  }
}
