import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExportType, ExportFrequency, ExportStatus } from "@prisma/client";

// ===== Types =====

export interface ScheduledExport {
  id: string;
  name: string;
  description?: string;
  exportType: ExportType;
  filters?: Record<string, unknown>;
  columns: string[];
  frequency: ExportFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
  recipients: string[];
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportHistory {
  id: string;
  scheduledExportId?: string;
  exportType: ExportType;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  rowCount?: number;
  status: ExportStatus;
  error?: string;
  startedAt: string;
  completedAt?: string;
  createdBy?: string;
}

export interface ExportsResponse {
  scheduledExports: ScheduledExport[];
  recentHistory?: ExportHistory[];
}

// ===== Hooks =====

export function useScheduledExports(includeHistory = false) {
  return useQuery<ExportsResponse>({
    queryKey: ["scheduledExports", includeHistory],
    queryFn: async () => {
      const res = await fetch(`/api/admin/exports?includeHistory=${includeHistory}`);
      if (!res.ok) throw new Error("Failed to fetch exports");
      return res.json();
    },
  });
}

export function useScheduledExport(id: string) {
  return useQuery<ScheduledExport & { history: ExportHistory[] }>({
    queryKey: ["scheduledExport", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/exports/${id}`);
      if (!res.ok) throw new Error("Failed to fetch export");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useRunExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: {
      exportType: ExportType;
      filters?: Record<string, unknown>;
      columns?: string[];
    }) => {
      const res = await fetch("/api/admin/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          ...options,
        }),
      });
      if (!res.ok) throw new Error("Failed to run export");

      // Return the CSV blob
      const blob = await res.blob();
      return blob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledExports"] });
    },
  });
}

export function useCreateScheduledExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      exportType: ExportType;
      filters?: Record<string, unknown>;
      columns?: string[];
      frequency: ExportFrequency;
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay?: string;
      recipients: string[];
    }) => {
      const res = await fetch("/api/admin/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          ...data,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create scheduled export");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledExports"] });
    },
  });
}

export function useUpdateScheduledExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      filters?: Record<string, unknown>;
      columns?: string[];
      frequency?: ExportFrequency;
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay?: string;
      recipients?: string[];
      isActive?: boolean;
    }) => {
      const res = await fetch(`/api/admin/exports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update export");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scheduledExports"] });
      queryClient.invalidateQueries({ queryKey: ["scheduledExport", variables.id] });
    },
  });
}

export function useDeleteScheduledExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/exports/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete export");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledExports"] });
    },
  });
}

// ===== Utility =====

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
