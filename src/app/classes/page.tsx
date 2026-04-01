"use client";

import { useState } from "react";
import Link from "next/link";
import { ClientHeader } from "@/components/portal/ClientHeader";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyClasses, useCreateClass, Class } from "@/hooks/useClasses";
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
const colorOptions = [
  "#6A469D", // Primary 500
  "#34B256", // Success / Accent Green
  "#FACC29", // Warning / Accent Yellow
  "#DA2E72", // Error / Accent Pink
  "#5B3C87", // Primary 600
  "#50C8DF", // Accent Cyan
  "#F79A30", // Accent Orange
  "#2D2F8E", // Accent Navy
];

export default function ClassesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassColor, setNewClassColor] = useState(colorOptions[0]);

  const { data: classes = [], isLoading, error } = useMyClasses();
  const createClassMutation = useCreateClass();

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      await createClassMutation.mutateAsync({
        name: newClassName.trim(),
        description: newClassDescription.trim() || undefined,
        color: newClassColor,
      });
      setIsCreating(false);
      setNewClassName("");
      setNewClassDescription("");
      setNewClassColor(colorOptions[0]);
    } catch (err) {
      console.error("Failed to create class:", err);
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const totalSessions = classes.reduce((sum, c) => sum + (c._count?.sessions || 0), 0);

  return (
    <div className="min-h-screen bg-accent-light">
      <ClientHeader />

      <DashboardLayout>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Page Title */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">My Classes</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Manage your student groups</p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            New Class
          </Button>
        </div>

        <div className="px-5 sm:px-6 py-5 sm:py-6">

        {/* Create Class Modal */}
        {isCreating && (
          <Card className="mb-8 border-2 border-primary-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="text-lg font-semibold text-neutral-900">Create New Class</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-neutral-400" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClass} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Monday Beginners"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Intro to chess for ages 5-7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Color
                  </label>
                  <div className="flex gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewClassColor(color)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          newClassColor === color ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClassMutation.isPending || !newClassName}>
                    {createClassMutation.isPending && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                    Create Class
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-error bg-error-light">
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-4 text-error-dark">
                <ExclamationCircleIcon className="w-12 h-12" />
                <p className="text-lg font-medium">Failed to load classes</p>
                <p className="text-sm text-error">Please try refreshing the page.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classes Grid */}
        {!isLoading && !error && (
          <>
            {classes.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                    <AcademicCapIcon className="w-12 h-12 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Classes Yet</h3>
                  <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                    Create your first class to start tracking student progress and managing your teaching sessions.
                  </p>
                  <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Create Your First Class
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {classes.map((classItem) => (
                  <Link key={classItem.id} href={`/classes/${classItem.id}`}>
                    <Card className="h-full border-0 shadow-sm overflow-hidden transition-all hover:shadow-sm hover:-translate-y-1 cursor-pointer">
                      <div className="h-2" style={{ backgroundColor: classItem.color || "#6366f1" }} />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${classItem.color || "#6366f1"}15` }}
                          >
                            <AcademicCapIcon className="w-7 h-7" style={{ color: classItem.color || "#6366f1" }} />
                          </div>
                          <button
                            onClick={(e) => e.preventDefault()}
                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{classItem.name}</h3>
                        <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                          {classItem.description || "No description"}
                        </p>

                        {classItem.currentLesson && (
                          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl mb-4">
                            <BookOpenIcon className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-600">
                              Currently on <span className="font-medium">Lesson {classItem.currentLesson.number}</span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-neutral-500">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4" />
                            <span>{classItem._count?.students || 0} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{classItem._count?.sessions || 0} sessions</span>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-neutral-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {/* Add New Class Card */}
                <Card
                  className="h-full border-2 border-dashed border-neutral-200 hover:border-primary-300 cursor-pointer transition-all hover:shadow-sm"
                  onClick={() => setIsCreating(true)}
                >
                  <CardContent className="h-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                      <PlusIcon className="w-7 h-7 text-neutral-400" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">Create New Class</h3>
                    <p className="text-sm text-neutral-500">Add a new student group</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tip Card */}
            {classes.length > 0 && (
              <Card className="mt-8 border-0 shadow-sm bg-gradient-to-r from-primary-50 via-primary-50/50 to-white">
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Pro Tip</h3>
                      <p className="text-sm text-neutral-600">
                        Click on a class to view details, add students, and log teaching sessions.
                        Track each student&apos;s progress through the curriculum!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        </div>
        </div>
      </DashboardLayout>
    </div>
  );
}
