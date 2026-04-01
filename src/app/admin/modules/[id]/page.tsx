"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DraggableList } from "@/components/dnd/DraggableList";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import {
  useModule,
  useUpdateModule,
} from "@/hooks/useModules";
import {
  useLessons,
  useCreateLesson,
  useReorderLessons,
} from "@/hooks/useLessons";
import { toast } from "sonner";
import { PromptDialog } from "@/components/ui/prompt-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ModuleEditPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: module, isLoading } = useModule(id, { includeLessons: true });
  const { data: lessons } = useLessons({ moduleId: id });
  const updateMutation = useUpdateModule();
  const createLessonMutation = useCreateLesson();
  const reorderLessonsMutation = useReorderLessons();

  const [lessonPromptOpen, setLessonPromptOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || "",
        status: module.status,
      });
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast.success("Module updated successfully");
    } catch {
      toast.error("Failed to update module");
    }
  };

  const handleAddLesson = () => {
    setLessonPromptOpen(true);
  };

  const handleLessonPromptSubmit = async (title: string) => {
    try {
      await createLessonMutation.mutateAsync({
        moduleId: id,
        title,
        number: (lessons?.length || 0) + 1,
      });
      toast.success("Lesson created successfully");
    } catch {
      toast.error("Failed to create lesson");
    }
  };

  const handleReorderLessons = async (reorderedLessons: typeof lessons) => {
    if (!reorderedLessons) return;

    const updates = reorderedLessons.map((lesson, index) => ({
      id: lesson.id,
      order: index + 1,
    }));

    try {
      await reorderLessonsMutation.mutateAsync(updates);
      toast.success("Order updated");
    } catch {
      toast.error("Failed to update order");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Module not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/modules"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Modules
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-heading-lg text-neutral-900">Edit Module</h1>
          <StatusBadge status={module.status} size="md" />
        </div>
        <p className="text-body text-neutral-500 mt-1">
          {module.curriculum?.title}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Module Details</h2>
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
                placeholder="e.g., Introduction to Chess"
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
                rows={3}
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Brief description of the module..."
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
          <Link href="/admin/modules">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={updateMutation.isPending || !formData.title}
          >
            {updateMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            CheckIcon Changes
          </Button>
        </div>
      </form>

      {/* Lessons Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-heading-sm text-neutral-900">Lessons</h2>
          <Button size="sm" onClick={handleAddLesson}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </CardHeader>
        <CardContent>
          {lessons?.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">
                No lessons yet. Add your first lesson!
              </p>
            </div>
          ) : (
            <DraggableList
              items={lessons || []}
              onReorder={handleReorderLessons}
              renderItem={(lesson) => (
                <DraggableItem key={lesson.id} id={lesson.id}>
                  <Link
                    href={`/admin/lessons/${lesson.id}`}
                    className="flex items-center gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)] hover:bg-neutral-100 transition-colors"
                  >
                    <div className="h-10 w-10 bg-neutral-200 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
                      <span className="text-neutral-600 font-bold">
                        {lesson.number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 truncate">
                        {lesson.title}
                      </h3>
                      <p className="text-body-sm text-neutral-500">
                        {lesson.subtitle || "No subtitle"}
                      </p>
                    </div>
                    <StatusBadge status={lesson.status} />
                    <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
                  </Link>
                </DraggableItem>
              )}
              renderOverlay={(lesson) => (
                <div className="flex items-center gap-4 p-4 bg-card rounded-[var(--radius-lg)] border border-border">
                  <div className="h-10 w-10 bg-neutral-200 rounded-[var(--radius-md)] flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">
                      {lesson.title}
                    </h3>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      <PromptDialog
        isOpen={lessonPromptOpen}
        onClose={() => setLessonPromptOpen(false)}
        onSubmit={handleLessonPromptSubmit}
        title="Add Lesson"
        message="Enter a title for the new lesson."
        placeholder="e.g., The King's Journey"
      />
    </div>
  );
}
