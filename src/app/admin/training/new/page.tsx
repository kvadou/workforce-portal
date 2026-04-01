"use client";

import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateCourse } from "@/hooks/useTrainingCourses";
import { toast } from "sonner";
import type { CourseCategory, CourseDifficulty } from "@prisma/client";

const categoryOptions: { value: CourseCategory; label: string }[] = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "TEACHING_SKILLS", label: "Teaching Skills" },
  { value: "CHESS_SKILLS", label: "Chess Skills" },
  { value: "BUSINESS", label: "Business" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "CERTIFICATION", label: "Certification" },
];

const difficultyOptions: { value: CourseDifficulty; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export default function NewTrainingCoursePage() {
  const router = useRouter();
  const createMutation = useCreateCourse();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnailUrl: "",
    duration: "",
    difficulty: "BEGINNER" as CourseDifficulty,
    category: "TEACHING_SKILLS" as CourseCategory,
    isRequired: false,
    isPublished: false,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const course = await createMutation.mutateAsync({
        title: formData.title,
        slug: formData.slug,
        description: formData.description || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        difficulty: formData.difficulty,
        category: formData.category,
        isRequired: formData.isRequired,
        isPublished: formData.isPublished,
      });

      toast.success("Course created successfully");
      router.push(`/admin/training/${course.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create course");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/training"
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-primary-500 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Training Courses
        </Link>
        <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
          <AcademicCapIcon className="h-8 w-8 text-primary-500" />
          Create New Course
        </h1>
        <p className="text-body text-neutral-500 mt-1">
          Add a new training course to the LMS
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-neutral-900">Course Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Advanced Teaching Techniques"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Slug <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="e.g., advanced-teaching-techniques"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                URL-friendly identifier. Will be used in the course URL.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what students will learn..."
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnailUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category <span className="text-error">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as CourseCategory,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as CourseDifficulty,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder="e.g., 60"
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, isRequired: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">Required course</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span className="text-sm text-neutral-700">
                  Publish immediately
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/training">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
