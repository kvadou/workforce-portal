"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { TCAppointment } from "@/hooks/useTutorProfiles";

/* ─── Props ─── */

interface FullCalendarViewProps {
  appointments: TCAppointment[];
}

/* ─── Main Component ─── */

export default function FullCalendarView({ appointments }: FullCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<TCAppointment | null>(null);

  const events = useMemo(() => {
    return appointments.map((appt) => {
      const isPast = new Date(appt.finish) < new Date();
      return {
        id: String(appt.id),
        title: appt.service,
        start: appt.start,
        end: appt.finish,
        backgroundColor: isPast ? "#22c55e" : "#7c5cfc",
        borderColor: isPast ? "#16a34a" : "#6a469d",
        extendedProps: {
          client: appt.client,
          payRate: appt.pay_rate,
          chargeRate: appt.charge_rate,
          appointment: appt,
        },
      };
    });
  }, [appointments]);

  const handleEventClick = (info: EventClickArg) => {
    const appt = info.event.extendedProps.appointment as TCAppointment;
    setSelectedEvent(appt);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-4 fc-acme-wrapper">
        <style>{`
          .fc-acme-wrapper .fc {
            font-family: var(--font-poppins), 'Poppins', sans-serif;
            font-size: 13px;
          }
          .fc-acme-wrapper .fc .fc-toolbar-title {
            font-size: 1rem;
            font-weight: 600;
          }
          .fc-acme-wrapper .fc .fc-button {
            font-size: 0.75rem;
            padding: 4px 10px;
            border-radius: 8px;
            font-weight: 500;
          }
          .fc-acme-wrapper .fc .fc-button-primary {
            background-color: #f3f4f6;
            border-color: #e5e7eb;
            color: #374151;
          }
          .fc-acme-wrapper .fc .fc-button-primary:hover {
            background-color: #e5e7eb;
            border-color: #d1d5db;
            color: #111827;
          }
          .fc-acme-wrapper .fc .fc-button-primary.fc-button-active,
          .fc-acme-wrapper .fc .fc-button-primary:active {
            background-color: #7c5cfc;
            border-color: #7c5cfc;
            color: white;
          }
          .fc-acme-wrapper .fc .fc-today-button {
            background-color: white;
            border-color: #c4b5fd;
            color: #7c5cfc;
          }
          .fc-acme-wrapper .fc .fc-today-button:hover {
            background-color: #f5f3ff;
          }
          .fc-acme-wrapper .fc .fc-today-button:disabled {
            opacity: 0.4;
          }
          .fc-acme-wrapper .fc .fc-col-header-cell {
            padding: 8px 0;
            font-weight: 500;
            color: #6b7280;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .fc-acme-wrapper .fc .fc-daygrid-day-number {
            font-size: 0.75rem;
            color: #6b7280;
            padding: 4px 8px;
          }
          .fc-acme-wrapper .fc .fc-day-today {
            background-color: #f5f3ff !important;
          }
          .fc-acme-wrapper .fc .fc-day-today .fc-daygrid-day-number {
            background-color: #7c5cfc;
            color: white;
            border-radius: 9999px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .fc-acme-wrapper .fc .fc-event {
            border-radius: 4px;
            font-size: 0.7rem;
            padding: 1px 4px;
            cursor: pointer;
          }
          .fc-acme-wrapper .fc .fc-daygrid-event-dot {
            display: none;
          }
          .fc-acme-wrapper .fc td, .fc-acme-wrapper .fc th {
            border-color: #f3f4f6;
          }
          .fc-acme-wrapper .fc .fc-scrollgrid {
            border-color: #e5e7eb;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listWeek",
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          nowIndicator
        />
      </div>

      {/* Event Detail Popover */}
      {selectedEvent && (
        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">{selectedEvent.service}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                {new Date(selectedEvent.start).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-neutral-500">
                {new Date(selectedEvent.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {" \u2013 "}
                {new Date(selectedEvent.finish).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs text-neutral-500">Client</p>
              <p className="text-sm font-medium text-neutral-900">{selectedEvent.client}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pay Rate</p>
              <p className="text-sm font-medium text-neutral-900">${Number(selectedEvent.pay_rate).toFixed(2)}/hr</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Duration</p>
              <p className="text-sm font-medium text-neutral-900">
                {Math.round((new Date(selectedEvent.finish).getTime() - new Date(selectedEvent.start).getTime()) / 60000)}m
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
