import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AlertType, AlertStatus, AlertSeverity } from "@prisma/client";

// ===== Types =====

export interface EngagementAlert {
  id: string;
  userId: string;
  type: AlertType;
  status: AlertStatus;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  triggeredAt: string;
  viewedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  user: {
    id: string;
    name?: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
}

export interface AlertSummary {
  byStatus: Record<AlertStatus, number>;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
}

export interface AlertsResponse {
  alerts: EngagementAlert[];
  summary: AlertSummary;
}

// ===== Hooks =====

export function useAlerts(options?: {
  status?: AlertStatus;
  type?: AlertType;
  severity?: AlertSeverity;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.type) params.set("type", options.type);
  if (options?.severity) params.set("severity", options.severity);
  if (options?.limit) params.set("limit", options.limit.toString());

  const queryString = params.toString();

  return useQuery<AlertsResponse>({
    queryKey: ["alerts", options],
    queryFn: async () => {
      const res = await fetch(`/api/admin/alerts${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useRunEngagementCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to run engagement check");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AlertStatus;
    }) => {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
