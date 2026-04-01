"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CheckIcon,
  CubeIcon,
  LightBulbIcon,
  PrinterIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useLesson, useUpdateLesson } from "@/hooks/useLessons";
import { useModules } from "@/hooks/useModules";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LessonEditPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: lesson, isLoading } = useLesson(id);
  const { data: modules } = useModules();
  const updateMutation = useUpdateLesson();

  const [formData, setFormData] = useState({
    number: 1,
    title: "",
    subtitle: "",
    videoUrl: "",
    videoDuration: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        number: lesson.number,
        title: lesson.title,
        subtitle: lesson.subtitle || "",
        videoUrl: lesson.videoUrl || "",
        videoDuration: lesson.videoDuration || "",
        status: lesson.status,
      });
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({ id, data: formData });
      toast.success("Lesson updated successfully");
    } catch {
      toast.error("Failed to update lesson");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Lesson not found</p>
      </div>
    );
  }

  const contentSections = [
    {
      icon: BookOpenIcon,
      label: "Story Content",
      href: `/admin/lessons/${id}/story`,
      description: "Edit the lesson story and narrative",
      colorClass: "bg-info-light text-info",
    },
    {
      icon: CubeIcon,
      label: "Chessercises",
      href: `/admin/lessons/${id}/chessercises`,
      description: "Warm Up, Dress Up, Chess Up activities",
      colorClass: "bg-accent-orange-light text-accent-orange",
    },
    {
      icon: QuestionMarkCircleIcon,
      label: "Exercises",
      href: `/admin/lessons/${id}/exercises`,
      description: `${lesson.exercises?.length || 0} exercises`,
      colorClass: "bg-accent-navy-light text-accent-navy",
    },
    {
      icon: PrinterIcon,
      label: "Print Materials",
      href: `/admin/lessons/${id}/materials`,
      description: `${lesson.printMaterials?.length || 0} materials`,
      colorClass: "bg-error-light text-error",
    },
    {
      icon: LightBulbIcon,
      label: "Developmental Skills",
      href: `/admin/lessons/${id}/skills`,
      description: `${lesson.developmentalSkills?.length || 0} skills`,
      colorClass: "bg-success-light text-success",
    },
  ];

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
          <h1 className="text-heading-lg text-neutral-900">Edit Lesson</h1>
          <StatusBadge status={lesson.status} size="md" />
        </div>
        <p className="text-body text-neutral-500 mt-1">
          {lesson.module?.curriculum?.title} → {lesson.module?.title}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Lesson Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="number"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Lesson Number *
                </label>
                <input
                  id="number"
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      status: e.target.value as
                        | "DRAFT"
                        | "PUBLISHED"
                        | "ARCHIVED",
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex justify-end gap-3 mb-8">
          <Link href="/admin/lessons">
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

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <h2 className="text-heading-sm text-neutral-900">Lesson Content</h2>
          <p className="text-body-sm text-neutral-500">
            Manage the different content sections of this lesson
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentSections.map((section) => (
              <Link
                key={section.label}
                href={section.href}
                className="flex items-start gap-4 p-4 bg-neutral-50 rounded-[var(--radius-lg)] hover:bg-neutral-100 transition-colors"
              >
                <div
                  className={`h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center ${section.colorClass}`}
                >
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900">
                    {section.label}
                  </h3>
                  <p className="text-body-sm text-neutral-500">
                    {section.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
