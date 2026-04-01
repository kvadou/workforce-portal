"use client";

import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useCourses, useDeleteCourse } from "@/hooks/useCourses";
import { useDeleteModule } from "@/hooks/useModules";
import { useDeleteLesson } from "@/hooks/useLessons";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Lesson {
  id: string;
  number: number;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  order: number;
}

interface Module {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  order: number;
  lessons?: Lesson[];
  _count?: { lessons: number };
}

interface Curriculum {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  order: number;
  modules?: Module[];
}

export default function CurriculumPage() {
  const { data: curricula, isLoading } = useCourses({ includeModules: true, includeLessons: true });
  const deleteCurriculumMutation = useDeleteCourse();
  const deleteModuleMutation = useDeleteModule();
  const deleteLessonMutation = useDeleteLesson();

  const [expandedCurricula, setExpandedCurricula] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: "curriculum" | "module" | "lesson";
    id: string;
    name: string;
  }>({ isOpen: false, type: "curriculum", id: "", name: "" });

  const toggleCurriculum = (id: string) => {
    setExpandedCurricula((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === "curriculum") {
        await deleteCurriculumMutation.mutateAsync(deleteDialog.id);
        toast.success("Curriculum deleted successfully");
      } else if (deleteDialog.type === "module") {
        await deleteModuleMutation.mutateAsync(deleteDialog.id);
        toast.success("Module deleted successfully");
      } else if (deleteDialog.type === "lesson") {
        await deleteLessonMutation.mutateAsync(deleteDialog.id);
        toast.success("Lesson deleted successfully");
      }
      setDeleteDialog({ isOpen: false, type: "curriculum", id: "", name: "" });
    } catch {
      toast.error(`Failed to delete ${deleteDialog.type}`);
    }
  };

  const filteredCurricula = curricula?.filter((curriculum: Curriculum) =>
    curriculum.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Curriculum</h1>
          <p className="text-body text-neutral-500">
            Manage your curriculum, modules, and lessons
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Curriculum
          </Button>
        </Link>
      </div>

      {/* MagnifyingGlassIcon */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="MagnifyingGlassIcon curriculum..."
              className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            Click to expand/collapse. Drag to reorder.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner fullPage />
          ) : !filteredCurricula?.length ? (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                {searchQuery ? "No curriculum found" : "No curriculum yet"}
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by creating your first curriculum"}
              </p>
              {!searchQuery && (
                <Link href="/admin/courses/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Curriculum
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCurricula.map((curriculum: Curriculum) => {
                const isExpanded = expandedCurricula.has(curriculum.id);
                const hasModules = (curriculum.modules?.length ?? 0) > 0;

                return (
                  <div key={curriculum.id} className="border border-neutral-200 rounded-lg">
                    {/* Curriculum Row */}
                    <div className="flex items-center gap-3 p-4 bg-warning-light rounded-t-lg">
                      <button
                        onClick={() => toggleCurriculum(curriculum.id)}
                        className="p-1 hover:bg-white/50 rounded transition-colors"
                        disabled={!hasModules}
                      >
                        {hasModules ? (
                          isExpanded ? (
                            <ChevronDownIcon className="h-5 w-5 text-neutral-600" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5 text-neutral-600" />
                          )
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                      </button>
                      <div className="h-10 w-10 bg-accent-orange rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpenIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {curriculum.title}
                        </h3>
                        <p className="text-body-sm text-neutral-500">
                          {curriculum.modules?.length || 0} modules
                        </p>
                      </div>
                      <StatusBadge status={curriculum.status} />
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/courses/${curriculum.id}`}>
                          <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-white/50 rounded-lg transition-colors">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              isOpen: true,
                              type: "curriculum",
                              id: curriculum.id,
                              name: curriculum.title,
                            })
                          }
                          className="p-2 text-neutral-400 hover:text-error hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Modules */}
                    {isExpanded && curriculum.modules && (
                      <div className="border-t border-neutral-200">
                        {curriculum.modules.map((module: Module) => {
                          const isModuleExpanded = expandedModules.has(module.id);
                          const hasLessons = (module.lessons?.length ?? module._count?.lessons ?? 0) > 0;

                          return (
                            <div key={module.id} className="border-b border-neutral-100 last:border-b-0">
                              {/* Module Row */}
                              <div className="flex items-center gap-3 p-3 pl-12 bg-primary-50/50 hover:bg-primary-50 transition-colors">
                                <button
                                  onClick={() => toggleModule(module.id)}
                                  className="p-1 hover:bg-white/50 rounded transition-colors"
                                  disabled={!hasLessons}
                                >
                                  {hasLessons ? (
                                    isModuleExpanded ? (
                                      <ChevronDownIcon className="h-4 w-4 text-neutral-600" />
                                    ) : (
                                      <ChevronRightIcon className="h-4 w-4 text-neutral-600" />
                                    )
                                  ) : (
                                    <div className="h-4 w-4" />
                                  )}
                                </button>
                                <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FolderOpenIcon className="h-4 w-4 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-neutral-900 truncate">
                                    {module.title}
                                  </h4>
                                  <p className="text-body-xs text-neutral-500">
                                    {module.lessons?.length ?? module._count?.lessons ?? 0} lessons
                                  </p>
                                </div>
                                <StatusBadge status={module.status} />
                                <div className="flex items-center gap-1">
                                  <Link href={`/admin/modules/${module.id}`}>
                                    <button className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-white/50 rounded transition-colors">
                                      <PencilSquareIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() =>
                                      setDeleteDialog({
                                        isOpen: true,
                                        type: "module",
                                        id: module.id,
                                        name: module.title,
                                      })
                                    }
                                    className="p-1.5 text-neutral-400 hover:text-error hover:bg-white/50 rounded transition-colors"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Lessons */}
                              {isModuleExpanded && module.lessons && (
                                <div className="bg-white">
                                  {module.lessons.map((lesson: Lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center gap-3 p-2.5 pl-20 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                                    >
                                      <div className="h-6 w-6 bg-neutral-100 rounded flex items-center justify-center flex-shrink-0">
                                        <span className="text-body-xs font-medium text-neutral-600">
                                          {lesson.number}
                                        </span>
                                      </div>
                                      <DocumentTextIcon className="h-4 w-4 text-neutral-400" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-body-sm text-neutral-900 truncate block">
                                          {lesson.title}
                                        </span>
                                      </div>
                                      <StatusBadge status={lesson.status} />
                                      <div className="flex items-center gap-1">
                                        <Link href={`/admin/lessons/${lesson.id}`}>
                                          <button className="p-1 text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 rounded transition-colors">
                                            <PencilSquareIcon className="h-3 w-3" />
                                          </button>
                                        </Link>
                                        <button
                                          onClick={() =>
                                            setDeleteDialog({
                                              isOpen: true,
                                              type: "lesson",
                                              id: lesson.id,
                                              name: lesson.title,
                                            })
                                          }
                                          className="p-1 text-neutral-400 hover:text-error hover:bg-neutral-100 rounded transition-colors"
                                        >
                                          <TrashIcon className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {/* Add Lesson Button */}
                                  <Link href={`/admin/lessons/new?moduleId=${module.id}`}>
                                    <div className="flex items-center gap-2 p-2.5 pl-20 text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer border-t border-neutral-100">
                                      <PlusIcon className="h-4 w-4" />
                                      <span className="text-body-sm">Add Lesson</span>
                                    </div>
                                  </Link>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Add Module Button */}
                        <Link href={`/admin/courses/${curriculum.id}?addModule=true`}>
                          <div className="flex items-center gap-2 p-3 pl-12 text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                            <PlusIcon className="h-4 w-4" />
                            <span className="text-body-sm">Add Module</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, type: "curriculum", id: "", name: "" })
        }
        onConfirm={handleDelete}
        title={`Delete ${deleteDialog.type.charAt(0).toUpperCase() + deleteDialog.type.slice(1)}`}
        description={
          deleteDialog.type === "curriculum"
            ? "Are you sure you want to delete this curriculum? This will also delete all modules and lessons within it."
            : deleteDialog.type === "module"
            ? "Are you sure you want to delete this module? This will also delete all lessons within it."
            : "Are you sure you want to delete this lesson? This will also delete all associated content."
        }
        itemName={deleteDialog.name}
        isLoading={
          deleteCurriculumMutation.isPending ||
          deleteModuleMutation.isPending ||
          deleteLessonMutation.isPending
        }
      />
    </div>
  );
}
