"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModules } from "@/hooks/useModules";
import { useCreateLesson, useLessons } from "@/hooks/useLessons";
import { toast } from "sonner";

export default function NewLessonPage() {
  const router = useRouter();
  const { data: modules, isLoading: modulesLoading } = useModules();
  const createMutation = useCreateLesson();

  const [formData, setFormData] = useState({
    moduleId: "",
    number: 1,
    title: "",
    subtitle: "",
    videoUrl: "",
    videoDuration: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  // Get lessons for selected module to determine next lesson number
  const { data: existingLessons } = useLessons({
    moduleId: formData.moduleId || undefined,
  });

  // Auto-update lesson number when module changes
  const handleModuleChange = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      moduleId,
      number: 1, // Will be updated by useEffect-like logic below
    }));
  };

  // Calculate next lesson number
  const nextLessonNumber = existingLessons
    ? Math.max(...existingLessons.map((l) => l.number), 0) + 1
    : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.moduleId) {
      toast.error("Please select a module");
      return;
    }

    try {
      const newLesson = await createMutation.mutateAsync({
        ...formData,
        number: nextLessonNumber,
        subtitle: formData.subtitle || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: formData.videoDuration || null,
      });
      toast.success("Lesson created successfully");
      router.push(`/admin/lessons/${newLesson.id}`);
    } catch {
      toast.error("Failed to create lesson");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/lessons"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Lessons
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-100 rounded-[var(--radius-lg)] flex items-center justify-center">
            <DocumentTextIcon className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h1 className="text-heading-lg text-neutral-900">Create New Lesson</h1>
            <p className="text-body text-neutral-500">
              Add a new lesson to your curriculum
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Lesson Details</h2>
            <p className="text-body-sm text-neutral-500">
              Basic information about the lesson
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="moduleId"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Module *
              </label>
              {modulesLoading ? (
                <div className="flex items-center gap-2 text-neutral-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Loading modules...
                </div>
              ) : (
                <select
                  id="moduleId"
                  value={formData.moduleId}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a module...</option>
                  {modules?.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.curriculum?.title} - {module.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="number"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Lesson Number
                </label>
                <input
                  id="number"
                  type="number"
                  value={nextLessonNumber}
                  disabled
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-neutral-100 text-neutral-500"
                />
                <p className="text-body-sm text-neutral-400 mt-1">
                  Auto-assigned based on existing lessons
                </p>
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
            </div>

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
                placeholder="e.g., The King"
              />
            </div>

            <div>
              <label
                htmlFor="subtitle"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Subtitle
              </label>
              <input
                id="subtitle"
                type="text"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Meet King Shaky"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Video Content</h2>
            <p className="text-body-sm text-neutral-500">
              Optional video lesson content
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="videoUrl"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Video URL
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label
                  htmlFor="videoDuration"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Duration
                </label>
                <input
                  id="videoDuration"
                  type="text"
                  value={formData.videoDuration}
                  onChange={(e) =>
                    setFormData({ ...formData, videoDuration: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 5:30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/admin/lessons">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || !formData.title || !formData.moduleId}
          >
            {createMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            Create Lesson
          </Button>
        </div>
      </form>
    </div>
  );
}
