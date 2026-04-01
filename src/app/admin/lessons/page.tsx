import {
  ArrowPathIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FunnelIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";

// Redirect to unified curriculum page
export default function LessonsPageRedirect() {
  redirect("/admin/curriculum");
}

// Keep old code commented for reference
/*
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useLessons, useDeleteLesson } from "@/hooks/useLessons";
import { useModules } from "@/hooks/useModules";
import { toast } from "sonner";

function LessonsPage() {
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(
    undefined
  );
  const { data: lessons, isLoading } = useLessons({
    moduleId: selectedModuleId,
  });
  const { data: modules } = useModules();
  const deleteMutation = useDeleteLesson();

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    lessonId: string;
    lessonName: string;
  }>({ isOpen: false, lessonId: "", lessonName: "" });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.lessonId);
      toast.success("Lesson deleted successfully");
      setDeleteDialog({ isOpen: false, lessonId: "", lessonName: "" });
    } catch {
      toast.error("Failed to delete lesson");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Lessons</h1>
          <p className="text-body text-neutral-500">
            Manage your curriculum lessons
          </p>
        </div>
        <Link href="/admin/lessons/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-neutral-400" />
            <select
              value={selectedModuleId || ""}
              onChange={(e) =>
                setSelectedModuleId(e.target.value || undefined)
              }
              className="flex-1 px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Modules</option>
              {modules?.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            {lessons?.length || 0} lessons
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : lessons?.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No lessons yet
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                Get started by creating your first lesson
              </p>
              <Link href="/admin/lessons/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons?.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)] hover:bg-neutral-100 transition-colors"
                >
                  <div className="h-12 w-12 bg-neutral-200 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                    <span className="text-neutral-600 font-bold">
                      {lesson.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {lesson.title}
                    </h3>
                    <p className="text-body-sm text-neutral-500 truncate">
                      {lesson.subtitle || "No subtitle"}
                    </p>
                  </div>
                  <StatusBadge status={lesson.status} />
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/lessons/${lesson.id}`}>
                      <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          lessonId: lesson.id,
                          lessonName: lesson.title,
                        })
                      }
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <Link href={`/admin/lessons/${lesson.id}`}>
                      <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, lessonId: "", lessonName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Lesson"
        description="Are you sure you want to delete this lesson? This will also delete all associated content. This action cannot be undone."
        itemName={deleteDialog.lessonName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
*/
