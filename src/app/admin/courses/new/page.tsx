"use client";

import { ArrowLeftIcon, ArrowPathIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateCourse } from "@/hooks/useCourses";
import { toast } from "sonner";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const createMutation = useCreateCourse();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newCourse = await createMutation.mutateAsync(formData);
      toast.success("Course created successfully");
      router.push(`/admin/courses/${newCourse.id}`);
    } catch {
      toast.error("Failed to create course");
    }
  };

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
        <h1 className="text-heading-lg text-neutral-900">Create New Course</h1>
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

        <div className="flex justify-end gap-3">
          <Link href="/admin/courses">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || !formData.title}
          >
            {createMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
      </form>
    </div>
  );
}
