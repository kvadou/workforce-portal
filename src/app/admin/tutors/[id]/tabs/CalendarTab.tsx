"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDaysIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useTutorAppointments, type TCAppointment } from "@/hooks/useTutorProfiles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ComponentType } from "react";

/* ─── Dynamic import — FullCalendar breaks SSR ─── */

interface FullCalendarViewProps {
  appointments: TCAppointment[];
}

const FullCalendarView = dynamic(
  () => import("./FullCalendarView") as Promise<{ default: ComponentType<FullCalendarViewProps> }>,
  {
    ssr: false,
    loading: () => <div className="py-12 text-center"><LoadingSpinner /></div>,
  }
);

/* ─── Props ─── */

interface CalendarTabProps {
  tutorProfileId: string;
  tutorCruncherId: number | null;
}

/* ─── Main Component ─── */

export default function CalendarTab({ tutorProfileId, tutorCruncherId }: CalendarTabProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [listFilter, setListFilter] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading } = useTutorAppointments(tutorCruncherId ? tutorProfileId : null);

  if (!tutorCruncherId) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="h-12 w-12 text-neutral-300" />}
        title="No TutorCruncher Link"
        message="This tutor is not linked to TutorCruncher. Calendar data is unavailable."
      />
    );
  }

  if (isLoading) return <LoadingSpinner fullPage />;

  const appointments = data?.appointments || [];
  const total = data?.total || appointments.length;
  const hasMore = data?.hasMore || false;

  return (
    <div>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-primary-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <ListBulletIcon className="h-4 w-4" />
            List
          </button>
        </div>
        <p className="text-xs text-neutral-400">
          {appointments.length}{total > appointments.length ? ` of ${total}` : ""} appointments
          {hasMore && " (more available)"}
        </p>
      </div>

      {viewMode === "calendar" ? (
        <FullCalendarView appointments={appointments} />
      ) : (
        <ListView
          appointments={appointments}
          filter={listFilter}
          onFilterChange={setListFilter}
        />
      )}
    </div>
  );
}

/* ─── List View ─── */

function ListView({
  appointments,
  filter,
  onFilterChange,
}: {
  appointments: TCAppointment[];
  filter: "upcoming" | "past";
  onFilterChange: (f: "upcoming" | "past") => void;
}) {
  const now = new Date();

  const upcoming = appointments
    .filter((a) => new Date(a.start) >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const past = appointments
    .filter((a) => new Date(a.start) < now)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const displayed = filter === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => onFilterChange("upcoming")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === "upcoming"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => onFilterChange("past")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === "past"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon={<CalendarDaysIcon className="h-12 w-12 text-neutral-300" />}
          title={filter === "upcoming" ? "No Upcoming Appointments" : "No Past Appointments"}
          message={filter === "upcoming" ? "No scheduled lessons found." : "No completed lessons found."}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Date & Time</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Service</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Client</th>
                <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Pay Rate</th>
                <th className="text-right py-2 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Duration</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((appt) => {
                const start = new Date(appt.start);
                const end = new Date(appt.finish);
                const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

                return (
                  <tr key={appt.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-2 px-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {" \u2013 "}
                        {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="py-2 px-4 text-sm text-neutral-700">{appt.service}</td>
                    <td className="py-2 px-4 text-sm text-neutral-700">{appt.client}</td>
                    <td className="py-2 px-4 text-sm text-neutral-700 text-right tabular-nums">
                      ${Number(appt.pay_rate).toFixed(2)}/hr
                    </td>
                    <td className="py-2 px-4 text-sm text-neutral-500 text-right">
                      {durationMin}m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center py-12">
      {icon}
      <h3 className="text-sm font-semibold text-neutral-700 mt-3">{title}</h3>
      <p className="text-xs text-neutral-400 mt-1">{message}</p>
    </div>
  );
}
