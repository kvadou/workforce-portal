"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableList } from "@/components/dnd/DraggableList";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import {
  useCourse,
  useUpdateCourse,
  useCreateCourse,
} from "@/hooks/useCourses";
import {
  useModules,
  useCreateModule,
  useReorderModules,
} from "@/hooks/useModules";
import { toast } from "sonner";
import { PromptDialog } from "@/components/ui/prompt-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CourseEditPage({ params }: PageProps) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();

  const { data: course, isLoading } = useCourse(isNew ? "" : id, {
    includeModules: true,
  });
  const { data: modules } = useModules({ courseId: isNew ? undefined : id });
  const updateMutation = useUpdateCourse();
  const createMutation = useCreateCourse();
  const createModuleMutation = useCreateModule();
  const reorderModulesMutation = useReorderModules();

  const [modulePromptOpen, setModulePromptOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  // Update form when course data loads
  if (course && formData.title === "" && !isNew) {
    setFormData({
      title: course.title,
      description: course.description || "",
      status: course.status,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isNew) {
        const newCourse = await createMutation.mutateAsync(formData);
        toast.success("Course created successfully");
        router.push(`/admin/courses/${newCourse.id}`);
      } else {
        await updateMutation.mutateAsync({ id, data: formData });
        toast.success("Course updated successfully");
      }
    } catch {
      toast.error(isNew ? "Failed to create course" : "Failed to update course");
    }
  };

  const handleAddModule = () => {
    if (isNew) {
      toast.error("CheckIcon the course first before adding modules");
      return;
    }
    setModulePromptOpen(true);
  };

  const handleModulePromptSubmit = useCallback(async (title: string) => {
    try {
      await createModuleMutation.mutateAsync({
        courseId: id,
        title,
      });
      toast.success("Module created successfully");
    } catch {
      toast.error("Failed to create module");
    }
  }, [createModuleMutation, id]);

  const handleReorderModules = async (reorderedModules: typeof modules) => {
    if (!reorderedModules) return;

    const updates = reorderedModules.map((module, index) => ({
      id: module.id,
      order: index + 1,
    }));

    try {
      await reorderModulesMutation.mutateAsync(updates);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/courses"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="text-heading-lg text-neutral-900">
          {isNew ? "Create Course" : "Edit Course"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Course Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Acme Workforce - Complete Curriculum"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Brief description of the course..."
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED",
                  })
                }
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mb-8">
          <Link href="/admin/courses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              updateMutation.isPending ||
              createMutation.isPending ||
              !formData.title
            }
          >
            {(updateMutation.isPending || createMutation.isPending) && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            {isNew ? "Create Course" : "CheckIcon Changes"}
          </Button>
        </div>
      </form>

      {!isNew && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-heading-sm text-neutral-900">Modules</h2>
            <Button size="sm" onClick={handleAddModule}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </CardHeader>
          <CardContent>
            {modules?.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">
                  No modules yet. Add your first module!
                </p>
              </div>
            ) : (
              <DraggableList
                items={modules || []}
                onReorder={handleReorderModules}
                renderItem={(module, index) => (
                  <DraggableItem key={module.id} id={module.id}>
                    <Link
                      href={`/admin/modules/${module.id}`}
                      className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)] hover:bg-neutral-100 transition-colors"
                    >
                      <div className="h-10 w-10 bg-primary-100 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-500 font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 truncate">
                          {module.title}
                        </h3>
                        <p className="text-body-sm text-neutral-500">
                          {module._count?.lessons || 0} lessons
                        </p>
                      </div>
                      <StatusBadge status={module.status} />
                      <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                    </Link>
                  </DraggableItem>
                )}
                renderOverlay={(module) => (
                  <div className="flex items-center gap-4 p-4 bg-card rounded-[var(--radius-lg)] border border-border">
                    <div className="h-10 w-10 bg-primary-100 rounded-[var(--radius-md)] flex items-center justify-center">
                      <FolderOpenIcon className="h-5 w-5 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">
                        {module.title}
                      </h3>
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
      )}

      <PromptDialog
        isOpen={modulePromptOpen}
        onClose={() => setModulePromptOpen(false)}
        onSubmit={handleModulePromptSubmit}
        title="Add Module"
        message="Enter a title for the new module."
        placeholder="e.g., Introduction to Chess"
      />
    </div>
  );
}
