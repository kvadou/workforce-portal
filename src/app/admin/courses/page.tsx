import {
  ArrowPathIcon,
  BookOpenIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { redirect } from "next/navigation";

// Redirect to unified curriculum page
export default function CoursesPageRedirect() {
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
import { DraggableList } from "@/components/dnd/DraggableList";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { useCourses, useDeleteCourse, useReorderCourses } from "@/hooks/useCourses";
import { toast } from "sonner";

export default function CoursesPage() {
  const { data: courses, isLoading } = useCourses({ includeModules: true });
  const deleteMutation = useDeleteCourse();
  const reorderMutation = useReorderCourses();

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    courseId: string;
    courseName: string;
  }>({ isOpen: false, courseId: "", courseName: "" });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.courseId);
      toast.success("Course deleted successfully");
      setDeleteDialog({ isOpen: false, courseId: "", courseName: "" });
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const handleReorder = async (reorderedCourses: typeof courses) => {
    if (!reorderedCourses) return;

    const updates = reorderedCourses.map((course, index) => ({
      id: course.id,
      order: index + 1,
    }));

    try {
      await reorderMutation.mutateAsync(updates);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Courses</h1>
          <p className="text-body text-neutral-500">
            Manage your curriculum courses
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <p className="text-body-sm text-neutral-500">
            Drag and drop to reorder courses
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : courses?.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-heading-sm text-neutral-900 mb-2">
                No courses yet
              </h3>
              <p className="text-body text-neutral-500 mb-6">
                Get started by creating your first course
              </p>
              <Link href="/admin/courses/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          ) : (
            <DraggableList
              items={courses || []}
              onReorder={handleReorder}
              renderItem={(course) => (
                <DraggableItem key={course.id} id={course.id}>
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)]">
                    <div className="h-12 w-12 bg-accent-orange rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                      <BookOpenIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {course.title}
                      </h3>
                      <p className="text-body-sm text-neutral-500">
                        {course.modules?.length || 0} modules
                      </p>
                    </div>
                    <StatusBadge status={course.status} />
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/courses/${course.id}`}>
                        <button className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteDialog({
                            isOpen: true,
                            courseId: course.id,
                            courseName: course.title,
                          });
                        }}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <Link href={`/admin/courses/${course.id}`}>
                        <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                      </Link>
                    </div>
                  </div>
                </DraggableItem>
              )}
              renderOverlay={(course) => (
                <div className="flex items-center gap-4 p-4 bg-card rounded-[var(--radius-lg)] border border-border">
                  <div className="h-12 w-12 bg-accent-orange rounded-[var(--radius-md)] flex items-center justify-center">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">
                      {course.title}
                    </h3>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, courseId: "", courseName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Course"
        description="Are you sure you want to delete this course? This will also delete all modules and lessons within it. This action cannot be undone."
        itemName={deleteDialog.courseName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
*/
