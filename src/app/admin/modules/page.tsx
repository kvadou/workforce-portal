import {
  ArrowPathIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  FunnelIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";

// Redirect to unified curriculum page
export default function ModulesPageRedirect() {
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
import { useModules, useDeleteModule } from "@/hooks/useModules";
import { useCourses } from "@/hooks/useCourses";
import { toast } from "sonner";

function ModulesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(
    undefined
  );
  const { data: modules, isLoading } = useModules({
    courseId: selectedCourseId,
  });
  const { data: courses } = useCourses();
  const deleteMutation = useDeleteModule();

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    moduleId: string;
    moduleName: string;
  }>({ isOpen: false, moduleId: "", moduleName: "" });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.moduleId);
      toast.success("Module deleted successfully");
      setDeleteDialog({ isOpen: false, moduleId: "", moduleName: "" });
    } catch {
      toast.error("Failed to delete module");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Modules</h1>
          <p className="text-body text-neutral-500">
            Manage your curriculum modules
          </p>
        </div>
        <Link href="/admin/courses">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-neutral-400" />
            <select
              value={selectedCourseId || ""}
              onChange={(e) =>
                setSelectedCourseId(e.target.value || undefined)
              }
              className="flex-1 px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Courses</option>
              {courses?.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            {modules?.length || 0} modules
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : modules?.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No modules yet
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                Modules are created within courses. Go to a course to add
                modules.
              </p>
              <Link href="/admin/courses">
                <Button>
                  <FolderOpenIcon className="h-4 w-4 mr-2" />
                  View Courses
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {modules?.map((module, index) => (
                <div
                  key={module.id}
                  className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)] hover:bg-neutral-100 transition-colors"
                >
                  <div className="h-12 w-12 bg-primary-100 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-500 font-bold">
                      {module.order || index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {module.title}
                    </h3>
                    <p className="text-body-sm text-neutral-500 truncate">
                      {module.course?.title || "No course"} •{" "}
                      {module._count?.lessons || 0} lessons
                    </p>
                  </div>
                  <StatusBadge status={module.status} />
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/modules/${module.id}`}>
                      <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          moduleId: module.id,
                          moduleName: module.title,
                        })
                      }
                      className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <Link href={`/admin/modules/${module.id}`}>
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
          setDeleteDialog({ isOpen: false, moduleId: "", moduleName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Module"
        description="Are you sure you want to delete this module? This will also delete all lessons within it. This action cannot be undone."
        itemName={deleteDialog.moduleName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
*/
