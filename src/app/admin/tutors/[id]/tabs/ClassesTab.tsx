"use client";

import Link from "next/link";
import { UsersIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import type { AdminTutorOverview } from "@/hooks/useTutorProfiles";

interface ClassesTabProps {
  tutor: AdminTutorOverview;
}

export default function ClassesTab({ tutor }: ClassesTabProps) {
  const { active, totalStudents, list } = tutor.classes;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="h-10 w-10 rounded-lg bg-info-light text-info flex items-center justify-center mx-auto mb-2">
            <UsersIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold text-neutral-900">{active}</p>
          <p className="text-xs text-neutral-500">Active Classes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 text-center">
          <div className="h-10 w-10 rounded-lg bg-success-light text-success flex items-center justify-center mx-auto mb-2">
            <AcademicCapIcon className="h-5 w-5" />
          </div>
          <p className="text-xl font-bold text-neutral-900">{totalStudents}</p>
          <p className="text-xs text-neutral-500">Total Students</p>
        </div>
      </div>

      {/* Class List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-neutral-500" />
            Active Classes
          </h3>
        </div>
        <div className="p-4">
          {list.length > 0 ? (
            list.map((cls) => (
              <Link
                key={cls.id}
                href={`/classes/${cls.id}`}
                className="flex items-center gap-4 p-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cls.color || "#6366f1" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">
                    {cls.name}
                  </p>
                </div>
                <p className="text-sm text-neutral-500 whitespace-nowrap">
                  {cls.studentCount} students
                </p>
                <p className="text-sm text-neutral-500 whitespace-nowrap">
                  {cls.sessionCount} sessions
                </p>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium">No active classes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
