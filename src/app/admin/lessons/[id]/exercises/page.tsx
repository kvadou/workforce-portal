"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  CheckIcon,
  PencilSquareIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  useLesson,
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from "@/hooks/useLessons";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ExerciseFormData {
  number: number;
  title: string;
  instructions: string;
  solution: string;
  boardSetup: string;
}

export default function ExercisesPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: lesson, isLoading: lessonLoading } = useLesson(id);
  const { data: exercises, isLoading: exercisesLoading } = useExercises(id);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ExerciseFormData>({
    number: 1,
    title: "",
    instructions: "",
    solution: "",
    boardSetup: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    exerciseId: string;
    exerciseName: string;
  }>({ isOpen: false, exerciseId: "", exerciseName: "" });

  const resetForm = () => {
    setFormData({
      number: (exercises?.length || 0) + 1,
      title: "",
      instructions: "",
      solution: "",
      boardSetup: "",
    });
    setEditingExercise(null);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setFormData({
      number: (exercises?.length || 0) + 1,
      title: "",
      instructions: "",
      solution: "",
      boardSetup: "",
    });
    setIsCreating(true);
    setEditingExercise(null);
  };

  const handleStartEdit = (exercise: {
    id: string;
    number: number;
    title: string;
    instructions: string;
    solution: string;
    boardSetup: unknown;
  }) => {
    setFormData({
      number: exercise.number,
      title: exercise.title,
      instructions: exercise.instructions,
      solution: exercise.solution,
      boardSetup:
        typeof exercise.boardSetup === "string"
          ? exercise.boardSetup
          : JSON.stringify(exercise.boardSetup || {}),
    });
    setEditingExercise(exercise.id);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        number: formData.number,
        title: formData.title,
        instructions: formData.instructions,
        solution: formData.solution,
        boardSetup: formData.boardSetup ? JSON.parse(formData.boardSetup) : null,
      };

      if (editingExercise) {
        await updateMutation.mutateAsync({
          lessonId: id,
          exerciseId: editingExercise,
          data,
        });
        toast.success("Exercise updated");
      } else {
        await createMutation.mutateAsync({ lessonId: id, data });
        toast.success("Exercise created");
      }
      resetForm();
    } catch {
      toast.error(editingExercise ? "Failed to update exercise" : "Failed to create exercise");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        lessonId: id,
        exerciseId: deleteDialog.exerciseId,
      });
      toast.success("Exercise deleted");
      setDeleteDialog({ isOpen: false, exerciseId: "", exerciseName: "" });
    } catch {
      toast.error("Failed to delete exercise");
    }
  };

  if (lessonLoading || exercisesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <Link
          href={`/admin/lessons/${id}`}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Lesson
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-accent-navy-light rounded-[var(--radius-lg)] flex items-center justify-center">
              <QuestionMarkCircleIcon className="h-6 w-6 text-accent-navy" />
            </div>
            <div>
              <h1 className="text-heading-lg text-neutral-900">Exercises</h1>
              <p className="text-body text-neutral-500">
                Lesson {lesson?.number}: {lesson?.title}
              </p>
            </div>
          </div>
          {!isCreating && !editingExercise && (
            <Button onClick={handleStartCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exercise List */}
        <div className="space-y-4">
          <h2 className="text-heading-sm text-neutral-900">
            {exercises?.length || 0} Exercises
          </h2>

          {exercises?.length === 0 && !isCreating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <QuestionMarkCircleIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-heading-sm text-neutral-900 mb-2">
                  No exercises yet
                </h3>
                <p className="text-body text-neutral-500 mb-6">
                  Create your first exercise for this lesson
                </p>
                <Button onClick={handleStartCreate}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Exercise
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {exercises?.map((exercise) => (
                <Card
                  key={exercise.id}
                  className={`transition-all ${
                    editingExercise === exercise.id
                      ? "ring-2 ring-primary-500"
                      : "hover:shadow-card-hover"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Bars3Icon className="h-4 w-4" />
                        <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-bold text-sm">
                            {exercise.number}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {exercise.title}
                        </h3>
                        <p className="text-body-sm text-neutral-500 line-clamp-2">
                          {exercise.instructions}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(exercise)}
                          className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              isOpen: true,
                              exerciseId: exercise.id,
                              exerciseName: exercise.title,
                            })
                          }
                          className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit/Create Form */}
        {(isCreating || editingExercise) && (
          <Card className="h-fit sticky top-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-heading-sm text-neutral-900">
                {editingExercise ? "Edit Exercise" : "New Exercise"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-[var(--radius-md)] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="number"
                      className="block text-body-sm font-medium text-neutral-700 mb-1"
                    >
                      Number
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
                      className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
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
                      placeholder="Exercise title"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="instructions"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Instructions *
                  </label>
                  <textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    required
                    rows={3}
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="What should the student do?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="solution"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Solution *
                  </label>
                  <textarea
                    id="solution"
                    value={formData.solution}
                    onChange={(e) =>
                      setFormData({ ...formData, solution: e.target.value })
                    }
                    required
                    rows={2}
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="The correct answer or move"
                  />
                </div>

                <div>
                  <label
                    htmlFor="boardSetup"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Board Setup (JSON)
                  </label>
                  <textarea
                    id="boardSetup"
                    value={formData.boardSetup}
                    onChange={(e) =>
                      setFormData({ ...formData, boardSetup: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm"
                    placeholder='{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"}'
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      !formData.title ||
                      !formData.instructions ||
                      !formData.solution
                    }
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {editingExercise ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, exerciseId: "", exerciseName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Exercise"
        description="Are you sure you want to delete this exercise? This action cannot be undone."
        itemName={deleteDialog.exerciseName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
