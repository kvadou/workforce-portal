"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  CubeIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLesson, useChessercises, useUpdateChessercises } from "@/hooks/useLessons";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChessercisesPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: lesson, isLoading: lessonLoading } = useLesson(id);
  const { data: chessercises, isLoading: chessercisesLoading } = useChessercises(id);
  const updateMutation = useUpdateChessercises();

  const [formData, setFormData] = useState({
    warmUp: "",
    dressUp: "",
    chessUp: "",
  });

  useEffect(() => {
    if (chessercises) {
      setFormData({
        warmUp: chessercises.warmUp || "",
        dressUp: chessercises.dressUp || "",
        chessUp: chessercises.chessUp || "",
      });
    }
  }, [chessercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        lessonId: id,
        data: {
          warmUp: formData.warmUp || null,
          dressUp: formData.dressUp || null,
          chessUp: formData.chessUp || null,
        },
      });
      toast.success("Chessercises saved");
    } catch {
      toast.error("Failed to save chessercises");
    }
  };

  if (lessonLoading || chessercisesLoading) {
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
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-warning-light rounded-[var(--radius-lg)] flex items-center justify-center">
            <CubeIcon className="h-6 w-6 text-accent-orange" />
          </div>
          <div>
            <h1 className="text-heading-lg text-neutral-900">Chessercises</h1>
            <p className="text-body text-neutral-500">
              Lesson {lesson?.number}: {lesson?.title}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-info-light border-b border-info">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-info-light rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-info" />
              </div>
              <div>
                <h2 className="text-heading-sm text-neutral-900">Warm Up</h2>
                <p className="text-body-sm text-neutral-500">
                  Quick activities to get students ready for learning
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <textarea
              value={formData.warmUp}
              onChange={(e) => setFormData({ ...formData, warmUp: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-info resize-none font-mono text-sm"
              placeholder="Describe the warm-up activities...

Example:
1. Have students stand in a circle
2. Pass around a small chessboard
3. Each student names a piece they see"
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-primary-50 border-b border-primary-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👑</span>
              </div>
              <div>
                <h2 className="text-heading-sm text-neutral-900">Dress Up</h2>
                <p className="text-body-sm text-neutral-500">
                  Creative costume and role-play activities
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <textarea
              value={formData.dressUp}
              onChange={(e) => setFormData({ ...formData, dressUp: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm"
              placeholder="Describe the dress-up activities...

Example:
1. Bring out the King costume
2. Choose a volunteer to wear the crown
3. Practice walking like King Shaky (shaking!)"
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-success-light border-b border-success">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-success-light rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="text-heading-sm text-neutral-900">Chess Up</h2>
                <p className="text-body-sm text-neutral-500">
                  Chess-specific activities and board practice
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <textarea
              value={formData.chessUp}
              onChange={(e) => setFormData({ ...formData, chessUp: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-success resize-none font-mono text-sm"
              placeholder="Describe the chess-up activities...

Example:
1. Place the King on the board
2. Show how the King moves one square at a time
3. Let each student practice moving the King"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/admin/lessons/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            CheckIcon Chessercises
          </Button>
        </div>
      </form>
    </div>
  );
}
