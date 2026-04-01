"use client";

import { useState } from "react";
import {
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  MapPinIcon,
  TagIcon,
  TrophyIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import {
  useTutorAppointments,
  useTutorAuditLog,
} from "@/hooks/useTutorProfiles";

interface ActivityTabProps {
  tutorProfileId: string;
  tutorCruncherId: number | null;
}

type AuditFilter = "all" | "status" | "team" | "labels" | "certs" | "fields";

const filterConfig: { key: AuditFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "status", label: "Status" },
  { key: "team", label: "Team" },
  { key: "labels", label: "Labels" },
  { key: "certs", label: "Certs" },
  { key: "fields", label: "Fields" },
];

const filterActionMap: Record<AuditFilter, string[] | null> = {
  all: null,
  status: ["STATUS_CHANGE"],
  team: ["TEAM_CHANGE"],
  labels: ["LABEL_ADDED", "LABEL_REMOVED"],
  certs: ["CERTIFICATION_GRANTED", "CERTIFICATION_REVOKED"],
  fields: ["FIELD_UPDATE"],
};

function getActionIcon(action: string) {
  if (action === "STATUS_CHANGE") return CheckCircleIcon;
  if (action === "TEAM_CHANGE") return MapPinIcon;
  if (action === "LABEL_ADDED" || action === "LABEL_REMOVED") return TagIcon;
  if (action.includes("CERTIFICATION")) return TrophyIcon;
  return PencilSquareIcon;
}

function getActionColors(action: string) {
  if (action === "STATUS_CHANGE") return "bg-info-light text-info";
  if (action === "TEAM_CHANGE") return "bg-primary-100 text-primary-600";
  if (action === "LABEL_ADDED" || action === "LABEL_REMOVED")
    return "bg-warning-light text-warning";
  if (action.includes("CERTIFICATION")) return "bg-success-light text-success";
  return "bg-neutral-100 text-neutral-600";
}

function renderActionDescription(log: {
  action: string;
  field: string | null;
  previousValue: string | null;
  newValue: string | null;
}) {
  switch (log.action) {
    case "STATUS_CHANGE":
      return (
        <>
          Status changed from{" "}
          <span className="font-medium">{log.previousValue}</span> to{" "}
          <span className="font-medium">{log.newValue}</span>
        </>
      );
    case "TEAM_CHANGE":
      return (
        <>
          Team changed from{" "}
          <span className="font-medium">{log.previousValue}</span> to{" "}
          <span className="font-medium">{log.newValue}</span>
        </>
      );
    case "LABEL_ADDED":
      return (
        <>
          Label <span className="font-medium">{log.newValue}</span> added
        </>
      );
    case "LABEL_REMOVED":
      return (
        <>
          Label <span className="font-medium">{log.previousValue}</span>{" "}
          removed
        </>
      );
    case "CERTIFICATION_GRANTED":
      return (
        <>
          Certification <span className="font-medium">{log.field}</span>{" "}
          granted
        </>
      );
    case "CERTIFICATION_REVOKED":
      return (
        <>
          Certification <span className="font-medium">{log.field}</span>{" "}
          revoked
        </>
      );
    case "FIELD_UPDATE":
      return (
        <>
          <span className="font-medium">{log.field}</span> updated
          {log.previousValue && (
            <>
              {" "}
              from <span className="font-medium">{log.previousValue}</span>
            </>
          )}
          {log.newValue && (
            <>
              {" "}
              to <span className="font-medium">{log.newValue}</span>
            </>
          )}
        </>
      );
    default:
      return (
        <>
          {log.action.replace(/_/g, " ").toLowerCase()}
          {log.field && <> - {log.field}</>}
        </>
      );
  }
}

const APPT_STORAGE_KEY = 'columnWidths_activityAppointments';

export default function ActivityTab({
  tutorProfileId,
  tutorCruncherId,
}: ActivityTabProps) {
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(APPT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [resizing, setResizing] = useState<string | null>(null);

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || 120;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      setColumnWidths(prev => {
        const updated = { ...prev, [colKey]: newWidth };
        localStorage.setItem(APPT_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setResizing(null);
    };
    setResizing(colKey);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
  } = useTutorAppointments(tutorProfileId);

  const {
    data: auditLogData,
    isLoading: auditLogLoading,
  } = useTutorAuditLog(tutorProfileId, 50);

  const filteredLogs = auditLogData?.logs
    ? auditFilter === "all"
      ? auditLogData.logs
      : auditLogData.logs.filter((log) => {
          const allowedActions = filterActionMap[auditFilter];
          if (!allowedActions) return true;
          // For certs, also match partial action names containing CERTIFICATION
          if (auditFilter === "certs") {
            return (
              allowedActions.includes(log.action) ||
              log.action.includes("CERTIFICATION")
            );
          }
          return allowedActions.includes(log.action);
        })
    : [];

  return (
    <div className="space-y-4">
      {/* TutorCruncher Appointments */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 pb-0 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-neutral-500" />
            Recent Appointments
          </h3>
          {tutorCruncherId && (
            <a
              href={`https://account.acmeworkforce.com/contractors/${tutorCruncherId}/#calendar`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View in TutorCruncher
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="p-4">
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : !tutorCruncherId ? (
            <div className="text-center py-8 text-neutral-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium">
                This tutor is not linked to TutorCruncher
              </p>
            </div>
          ) : !appointmentsData?.appointments ||
            appointmentsData.appointments.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium">No recent appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-t border-b border-neutral-200 bg-neutral-50/50">
                    <th
                      className="relative text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none"
                      style={{ width: columnWidths['date'] || 120 }}
                    >
                      Date
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, 'date')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                    <th
                      className="relative text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none"
                      style={{ width: columnWidths['time'] || 160 }}
                    >
                      Time
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, 'time')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                    <th
                      className="relative text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none"
                      style={{ width: columnWidths['service'] || 180 }}
                    >
                      Service
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, 'service')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                    <th
                      className="relative text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none"
                      style={{ width: columnWidths['client'] || 160 }}
                    >
                      Client
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, 'client')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                    <th
                      className="relative text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap select-none"
                      style={{ width: columnWidths['payRate'] || 110 }}
                    >
                      Pay Rate
                      <div
                        className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-primary-500/20 group z-10"
                        onMouseDown={(e) => handleResizeStart(e, 'payRate')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mx-auto w-px h-full bg-neutral-200 group-hover:bg-primary-500/40" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsData.appointments.map((appt) => {
                    const startDate = new Date(appt.start);
                    const endDate = new Date(appt.finish);
                    return (
                      <tr
                        key={appt.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {startDate.toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {startDate.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {endDate.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {appt.service}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700">
                          {appt.client}
                        </td>
                        <td className="py-2 px-4 text-sm text-neutral-700 text-right tabular-nums font-medium">
                          ${appt.pay_rate.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-neutral-500" />
            Activity Log
          </h3>
        </div>
        <div className="p-4">
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {filterConfig.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setAuditFilter(filter.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  auditFilter === filter.key
                    ? "bg-primary-100 text-primary-700"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {auditLogLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                const colors = getActionColors(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900">
                        {renderActionDescription(log)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {log.performedByName || "System"} &middot;{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium">
                {auditFilter === "all"
                  ? "No activity recorded yet"
                  : "No matching activity found"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
