"use client";

import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";

interface SyncLog {
  id: string;
  syncType: string;
  status: string;
  contractorsFound: number;
  contractorsCreated: number;
  contractorsUpdated: number;
  errors: string[] | null;
  startedAt: string;
  completedAt: string | null;
}

interface SyncStats {
  lastSyncAt: string | null;
  totalSyncs: number;
  successfulSyncs: number;
  totalContractorsCreated: number;
}

async function fetchSyncLogs(): Promise<SyncLog[]> {
  const response = await fetch("/api/admin/stc-sync/logs");
  if (!response.ok) throw new Error("Failed to fetch sync logs");
  return response.json();
}

async function fetchSyncStats(): Promise<SyncStats> {
  const response = await fetch("/api/admin/stc-sync/stats");
  if (!response.ok) throw new Error("Failed to fetch sync stats");
  return response.json();
}

async function triggerSync(): Promise<{ success: boolean; contractorsFound: number; contractorsCreated: number; contractorsUpdated: number; errors: string[] }> {
  const response = await fetch("/api/admin/stc-sync/trigger", {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Sync failed");
  }
  return response.json();
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircleIcon }> = {
  SUCCESS: { color: "bg-success-light text-success-dark", icon: CheckCircleIcon },
  PARTIAL: { color: "bg-warning-light text-warning-dark", icon: ExclamationTriangleIcon },
  FAILED: { color: "bg-error-light text-error-dark", icon: XCircleIcon },
  IN_PROGRESS: { color: "bg-info-light text-info-dark", icon: ClockIcon },
};

export default function STCSyncPage() {
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["stcSyncLogs"],
    queryFn: fetchSyncLogs,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stcSyncStats"],
    queryFn: fetchSyncStats,
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (result) => {
      setSyncResult(
        `Sync complete: ${result.contractorsFound} found, ${result.contractorsCreated} created, ${result.contractorsUpdated} updated`
      );
      queryClient.invalidateQueries({ queryKey: ["stcSyncLogs"] });
      queryClient.invalidateQueries({ queryKey: ["stcSyncStats"] });
    },
    onError: (error) => {
      setSyncResult(`Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const isLoading = logsLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <CircleStackIcon className="h-7 w-7 text-primary-500" />
            Acme Contractor Sync
          </h1>
          <p className="text-neutral-600 mt-1">
            Synchronize approved contractors from Acme Workforce database
          </p>
        </div>
        <Button
          onClick={() => {
            setSyncResult(null);
            syncMutation.mutate();
          }}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Run Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Sync Result Alert */}
      {syncResult && (
        <div
          className={`p-4 rounded-lg ${
            syncResult.startsWith("Sync failed")
              ? "bg-error-light border border-error text-error-dark"
              : "bg-success-light border border-success text-success-dark"
          }`}
        >
          {syncResult}
        </div>
      )}

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <CalendarDaysIcon className="h-4 w-4" />
              <span className="text-sm">Last Sync</span>
            </div>
            <div className="text-lg font-semibold text-neutral-900">
              {stats.lastSyncAt
                ? formatDistanceToNow(new Date(stats.lastSyncAt), { addSuffix: true })
                : "Never"}
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <ArrowPathIcon className="h-4 w-4" />
              <span className="text-sm">Total Syncs</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.totalSyncs}
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm">Successful</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.successfulSyncs}
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-primary-500 mb-1">
              <CircleStackIcon className="h-4 w-4" />
              <span className="text-sm">Contractors Created</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {stats.totalContractorsCreated}
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Recent Sync Logs</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {logs.map((log) => {
              const config = statusConfig[log.status] || statusConfig.FAILED;
              const StatusIcon = config.icon;

              return (
                <div key={log.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${config.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {log.status}
                      </span>
                      <span className="text-sm text-neutral-500">
                        {format(new Date(log.startedAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    {log.completedAt && (
                      <span className="text-xs text-neutral-400">
                        Duration:{" "}
                        {Math.round(
                          (new Date(log.completedAt).getTime() -
                            new Date(log.startedAt).getTime()) /
                            1000
                        )}s
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-neutral-600">
                      <span className="font-medium">{log.contractorsFound}</span> found
                    </span>
                    <span className="text-success">
                      <span className="font-medium">{log.contractorsCreated}</span> created
                    </span>
                    <span className="text-info">
                      <span className="font-medium">{log.contractorsUpdated}</span> updated
                    </span>
                  </div>
                  {log.errors && log.errors.length > 0 && (
                    <div className="mt-2 p-2 bg-error-light rounded text-sm text-error">
                      {log.errors.slice(0, 3).map((error, i) => (
                        <div key={i}>{error}</div>
                      ))}
                      {log.errors.length > 3 && (
                        <div className="text-error">
                          ...and {log.errors.length - 3} more errors
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <CircleStackIcon className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
            <p>No sync logs yet</p>
            <p className="text-sm">Run your first sync to see results here</p>
          </div>
        )}
      </div>

      {/* Configuration Info */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h3 className="font-medium text-neutral-900 mb-2">Configuration</h3>
        <div className="text-sm text-neutral-600 space-y-1">
          <p>
            <span className="font-medium">Cron Endpoint:</span>{" "}
            <code className="bg-neutral-200 px-1 rounded">/api/cron/sync-contractors</code>
          </p>
          <p>
            <span className="font-medium">Schedule:</span> Recommended hourly via external scheduler
          </p>
          <p>
            <span className="font-medium">Authentication:</span> Bearer token using CRON_SECRET or INTERNAL_API_SECRET
          </p>
        </div>
      </div>
    </div>
  );
}
