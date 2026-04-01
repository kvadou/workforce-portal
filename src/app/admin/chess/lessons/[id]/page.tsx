"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CheckIcon,
  ExclamationCircleIcon,
  FlagIcon,
  PencilSquareIcon,
  PlusIcon,
  Square3Stack3DIcon,
  TrashIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Level {
  id: string;
  fen: string;
  goalText: string;
  goalType: string;
  targetSquares: string[];
  playerColor: string;
  hintText: string | null;
  order: number;
}

interface LessonDetail {
  id: string;
  title: string;
  subtitle: string | null;
  iconEmoji: string;
  categoryId: string;
  order: number;
  levels: Level[];
  category: Category;
}

interface LessonFormData {
  title: string;
  subtitle: string;
  iconEmoji: string;
  categoryId: string;
  order: number;
}

interface LevelFormData {
  fen: string;
  goalText: string;
  goalType: string;
  targetSquares: string;
  playerColor: string;
  hintText: string;
  order: number;
}

// ── Constants ──────────────────────────────────────────────────────

const GOAL_TYPES = [
  { value: "CAPTURE_TARGETS", label: "Capture Targets" },
  { value: "REACH_SQUARE", label: "Reach Square" },
  { value: "CHECKMATE", label: "Checkmate" },
  { value: "AVOID_CAPTURE", label: "Avoid Capture" },
  { value: "SEQUENCE", label: "Sequence" },
  { value: "CUSTOM", label: "Custom" },
];

const emptyLevelForm: LevelFormData = {
  fen: "",
  goalText: "",
  goalType: "CAPTURE_TARGETS",
  targetSquares: "",
  playerColor: "white",
  hintText: "",
  order: 1,
};

// ── Inner editor component ─────────────────────────────────────────

function LessonEditor({ lessonId }: { lessonId: string }) {
  const queryClient = useQueryClient();

  // Lesson form state
  const [lessonForm, setLessonForm] = useState<LessonFormData | null>(null);
  const [lessonDirty, setLessonDirty] = useState(false);

  // Level form state
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [levelForm, setLevelForm] = useState<LevelFormData>(emptyLevelForm);

  // ── Queries ────────────────────────────────────────────────────

  const {
    data: lesson,
    isLoading,
    error,
  } = useQuery<LessonDetail>({
    queryKey: ["adminChessLesson", lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chess/lessons/${lessonId}`);
      if (!res.ok) throw new Error("Failed to fetch lesson");
      return res.json();
    },
    // Populate lesson form on successful fetch
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["adminChessCategories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chess/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return data.categories || data;
    },
  });

  // Initialize form once lesson data loads
  if (lesson && !lessonForm) {
    setLessonForm({
      title: lesson.title,
      subtitle: lesson.subtitle || "",
      iconEmoji: lesson.iconEmoji,
      categoryId: lesson.categoryId,
      order: lesson.order,
    });
  }

  // ── Lesson Mutations ──────────────────────────────────────────

  const updateLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const res = await fetch(`/api/admin/chess/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update lesson");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessLesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["adminChessLessons"] });
      setLessonDirty(false);
      toast.success("Lesson updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Level Mutations ───────────────────────────────────────────

  const createLevelMutation = useMutation({
    mutationFn: async (data: LevelFormData) => {
      const payload = {
        ...data,
        targetSquares: data.targetSquares
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        lessonId,
      };
      const res = await fetch(`/api/admin/chess/lessons/${lessonId}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create level");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessLesson", lessonId] });
      setLevelForm(emptyLevelForm);
      setShowLevelForm(false);
      toast.success("Level created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateLevelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LevelFormData }) => {
      const payload = {
        ...data,
        targetSquares: data.targetSquares
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(
        `/api/admin/chess/lessons/${lessonId}/levels/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update level");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessLesson", lessonId] });
      setEditingLevel(null);
      setLevelForm(emptyLevelForm);
      toast.success("Level updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteLevelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/admin/chess/lessons/${lessonId}/levels/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete level");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessLesson", lessonId] });
      toast.success("Level deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Handlers ──────────────────────────────────────────────────

  const startEditLevel = (level: Level) => {
    setEditingLevel(level.id);
    setLevelForm({
      fen: level.fen,
      goalText: level.goalText,
      goalType: level.goalType,
      targetSquares: level.targetSquares.join(", "),
      playerColor: level.playerColor,
      hintText: level.hintText || "",
      order: level.order,
    });
    setShowLevelForm(false);
  };

  const startAddLevel = () => {
    setShowLevelForm(true);
    setEditingLevel(null);
    setLevelForm({
      ...emptyLevelForm,
      order: (lesson?.levels?.length || 0) + 1,
    });
  };

  // ── Loading / Error ───────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <h3 className="text-heading-sm text-neutral-900 mb-2">
          Failed to load lesson
        </h3>
        <p className="text-body text-neutral-500 mb-4">
          The lesson could not be found or there was a server error.
        </p>
        <Link href="/admin/chess/lessons">
          <Button variant="outline">Back to Lessons</Button>
        </Link>
      </div>
    );
  }

  const sortedLevels = [...lesson.levels].sort((a, b) => a.order - b.order);

  // ── Level Form ────────────────────────────────────────────────

  const renderLevelForm = (isEditing: boolean) => (
    <div className="p-4 border rounded-lg bg-neutral-50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-neutral-900">
          {isEditing ? "Edit Level" : "New Level"}
        </h4>
        <button
          onClick={() => {
            if (isEditing) {
              setEditingLevel(null);
            } else {
              setShowLevelForm(false);
            }
            setLevelForm(emptyLevelForm);
          }}
          className="p-1 text-neutral-400 hover:text-neutral-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          FEN Position
        </label>
        <input
          type="text"
          value={levelForm.fen}
          onChange={(e) =>
            setLevelForm((prev) => ({ ...prev, fen: e.target.value }))
          }
          placeholder="e.g. rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Goal Text
          </label>
          <input
            type="text"
            value={levelForm.goalText}
            onChange={(e) =>
              setLevelForm((prev) => ({ ...prev, goalText: e.target.value }))
            }
            placeholder="e.g. Capture the knight on d5"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Goal Type
          </label>
          <select
            value={levelForm.goalType}
            onChange={(e) =>
              setLevelForm((prev) => ({ ...prev, goalType: e.target.value }))
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {GOAL_TYPES.map((gt) => (
              <option key={gt.value} value={gt.value}>
                {gt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            FlagIcon Squares
          </label>
          <input
            type="text"
            value={levelForm.targetSquares}
            onChange={(e) =>
              setLevelForm((prev) => ({
                ...prev,
                targetSquares: e.target.value,
              }))
            }
            placeholder="e.g. e4, d5"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-neutral-400 mt-1">Comma-separated</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Player Color
          </label>
          <div className="flex rounded-lg border overflow-hidden">
            {(["white", "black"] as const).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  setLevelForm((prev) => ({ ...prev, playerColor: color }))
                }
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  levelForm.playerColor === color
                    ? color === "white"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {color === "white" ? "White" : "Black"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Order
          </label>
          <input
            type="number"
            value={levelForm.order}
            onChange={(e) =>
              setLevelForm((prev) => ({
                ...prev,
                order: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          Hint Text (optional)
        </label>
        <input
          type="text"
          value={levelForm.hintText}
          onChange={(e) =>
            setLevelForm((prev) => ({ ...prev, hintText: e.target.value }))
          }
          placeholder="e.g. Look for the undefended piece..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => {
            if (isEditing && editingLevel) {
              updateLevelMutation.mutate({ id: editingLevel, data: levelForm });
            } else {
              createLevelMutation.mutate(levelForm);
            }
          }}
          disabled={
            !levelForm.fen ||
            !levelForm.goalText ||
            createLevelMutation.isPending ||
            updateLevelMutation.isPending
          }
        >
          {(createLevelMutation.isPending || updateLevelMutation.isPending) ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <CheckIcon className="h-4 w-4 mr-1" />
          )}
          {isEditing ? "Update Level" : "Create Level"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (isEditing) {
              setEditingLevel(null);
            } else {
              setShowLevelForm(false);
            }
            setLevelForm(emptyLevelForm);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const goalTypeBadgeColor: Record<string, string> = {
    CAPTURE_TARGETS: "bg-error-light text-error-dark",
    REACH_SQUARE: "bg-info-light text-info-dark",
    CHECKMATE: "bg-primary-100 text-primary-700",
    AVOID_CAPTURE: "bg-warning-light text-warning-dark",
    SEQUENCE: "bg-success-light text-success-dark",
    CUSTOM: "bg-neutral-100 text-neutral-700",
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/chess/lessons"
          className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Lesson Management
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{lesson.iconEmoji || "--"}</span>
          <div>
            <h1 className="text-heading-lg text-neutral-900">{lesson.title}</h1>
            {lesson.subtitle && (
              <p className="text-body text-neutral-500">{lesson.subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lesson Details Form ────────────────────────────────── */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-primary-500" />
            Lesson Details
          </h2>
        </CardHeader>
        <CardContent>
          {lessonForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={lessonForm.iconEmoji}
                    onChange={(e) => {
                      setLessonForm((prev) =>
                        prev ? { ...prev, iconEmoji: e.target.value } : prev
                      );
                      setLessonDirty(true);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => {
                      setLessonForm((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev
                      );
                      setLessonDirty(true);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={lessonForm.order}
                    onChange={(e) => {
                      setLessonForm((prev) =>
                        prev
                          ? { ...prev, order: parseInt(e.target.value) || 0 }
                          : prev
                      );
                      setLessonDirty(true);
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={lessonForm.subtitle}
                  onChange={(e) => {
                    setLessonForm((prev) =>
                      prev ? { ...prev, subtitle: e.target.value } : prev
                    );
                    setLessonDirty(true);
                  }}
                  placeholder="Optional subtitle"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Category
                </label>
                <select
                  value={lessonForm.categoryId}
                  onChange={(e) => {
                    setLessonForm((prev) =>
                      prev ? { ...prev, categoryId: e.target.value } : prev
                    );
                    setLessonDirty(true);
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => updateLessonMutation.mutate(lessonForm)}
                  disabled={!lessonDirty || updateLessonMutation.isPending}
                >
                  {updateLessonMutation.isPending ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  CheckIcon Lesson
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Levels Section ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
              <Square3Stack3DIcon className="h-5 w-5 text-primary-500" />
              Levels ({sortedLevels.length})
            </h2>
            {!showLevelForm && !editingLevel && (
              <Button size="sm" onClick={startAddLevel}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Level
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add level form */}
          {showLevelForm && renderLevelForm(false)}

          {/* Levels list */}
          <div className={`space-y-3 ${showLevelForm ? "mt-4" : ""}`}>
            {sortedLevels.length > 0 ? (
              sortedLevels.map((level) => (
                <div key={level.id}>
                  {editingLevel === level.id ? (
                    renderLevelForm(true)
                  ) : (
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors">
                      {/* Order badge */}
                      <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                        {level.order}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-neutral-900">
                            {level.goalText}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                              goalTypeBadgeColor[level.goalType] ||
                              "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {level.goalType.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                              level.playerColor === "white"
                                ? "bg-white text-neutral-800 border border-neutral-300"
                                : "bg-neutral-800 text-white"
                            }`}
                          >
                            {level.playerColor === "white" ? (
                              <TrophyIcon className="h-3 w-3 mr-1" />
                            ) : (
                              <TrophyIcon className="h-3 w-3 mr-1" />
                            )}
                            {level.playerColor}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-neutral-400 truncate max-w-[500px]">
                          {level.fen}
                        </p>
                        {level.targetSquares.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <FlagIcon className="h-3 w-3 text-neutral-400" />
                            <span className="text-xs text-neutral-500">
                              {level.targetSquares.join(", ")}
                            </span>
                          </div>
                        )}
                        {level.hintText && (
                          <p className="text-xs text-warning mt-1 italic">
                            Hint: {level.hintText}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditLevel(level)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLevelMutation.mutate(level.id)}
                          disabled={deleteLevelMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Square3Stack3DIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No levels yet</p>
                <p className="text-sm text-neutral-400">
                  Add levels to build out this lesson
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page wrapper (Next.js 16 params pattern) ───────────────────────

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <LessonEditor lessonId={id} />;
}
