"use client";

import { ArrowLeftIcon, ArrowPathIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useLesson, useUpdateStory } from "@/hooks/useLessons";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StoryEditorPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: lesson, isLoading } = useLesson(id);
  const updateStoryMutation = useUpdateStory();

  const [formData, setFormData] = useState({
    introduction: "",
    teacherTip: "",
    content: "",
  });

  useEffect(() => {
    if (lesson?.story) {
      setFormData({
        introduction: lesson.story.introduction || "",
        teacherTip: lesson.story.teacherTip || "",
        content:
          typeof lesson.story.content === "string"
            ? lesson.story.content
            : JSON.stringify(lesson.story.content),
      });
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateStoryMutation.mutateAsync({
        lessonId: id,
        data: {
          introduction: formData.introduction || null,
          teacherTip: formData.teacherTip || null,
          content: formData.content,
        },
      });
      toast.success("Story content saved");
    } catch {
      toast.error("Failed to save story content");
    }
  };

  if (isLoading) {
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
          href={`/admin/lessons/${id}`}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Lesson
        </Link>
        <h1 className="text-heading-lg text-neutral-900">Story Content</h1>
        <p className="text-body text-neutral-500">
          Lesson {lesson?.number}: {lesson?.title}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Introduction</h2>
            <p className="text-body-sm text-neutral-500">
              A brief introduction read to students before the story
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.introduction}
              onChange={(e) =>
                setFormData({ ...formData, introduction: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Today we're going to learn about..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Teacher Tip</h2>
            <p className="text-body-sm text-neutral-500">
              Tips and guidance for the instructor
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.teacherTip}
              onChange={(e) =>
                setFormData({ ...formData, teacherTip: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Use props and visual aids to..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Story Content</h2>
            <p className="text-body-sm text-neutral-500">
              The main story narrative with rich text formatting
            </p>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Once upon a time in Chess Kingdom..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/admin/lessons/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateStoryMutation.isPending}>
            {updateStoryMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            CheckIcon Story
          </Button>
        </div>
      </form>
    </div>
  );
}
