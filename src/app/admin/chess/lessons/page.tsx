"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  FolderOpenIcon,
  PencilSquareIcon,
  PlusIcon,
  Square3Stack3DIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
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
  order: number;
  lessonCount: number;
}

interface Lesson {
  id: string;
  title: string;
  subtitle: string | null;
  iconEmoji: string;
  categoryId: string;
  order: number;
  levelCount: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  color: string;
  order: number;
}

interface LessonFormData {
  title: string;
  subtitle: string;
  iconEmoji: string;
  categoryId: string;
  order: number;
}

// ── Helpers ────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6b7280", // gray
  "#92400e", // amber/brown
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyCategoryForm: CategoryFormData = {
  name: "",
  slug: "",
  color: PRESET_COLORS[0],
  order: 0,
};

const emptyLessonForm: LessonFormData = {
  title: "",
  subtitle: "",
  iconEmoji: "",
  categoryId: "",
  order: 0,
};

// ── Component ──────────────────────────────────────────────────────

export default function LessonManagementPage() {
  const queryClient = useQueryClient();

  // Category state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Lesson state
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null); // categoryId
  const [lessonForm, setLessonForm] = useState<LessonFormData>(emptyLessonForm);

  // ── Queries ────────────────────────────────────────────────────

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["adminChessCategories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chess/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      return data.categories || data;
    },
  });

  const {
    data: lessons,
    isLoading: lessonsLoading,
  } = useQuery<Lesson[]>({
    queryKey: ["adminChessLessons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chess/lessons");
      if (!res.ok) throw new Error("Failed to fetch lessons");
      const data = await res.json();
      return data.lessons || data;
    },
  });

  // ── Category Mutations ────────────────────────────────────────

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await fetch("/api/admin/chess/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessCategories"] });
      setCategoryForm(emptyCategoryForm);
      setShowCategoryForm(false);
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const res = await fetch(`/api/admin/chess/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessCategories"] });
      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm);
      toast.success("Category updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/chess/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessCategories"] });
      queryClient.invalidateQueries({ queryKey: ["adminChessLessons"] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Lesson Mutations ──────────────────────────────────────────

  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const res = await fetch("/api/admin/chess/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lesson");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminChessLessons"] });
      queryClient.invalidateQueries({ queryKey: ["adminChessCategories"] });
      setLessonForm(emptyLessonForm);
      setShowLessonForm(null);
      toast.success("Lesson created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Handlers ──────────────────────────────────────────────────

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat.id);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      order: cat.order,
    });
    setShowCategoryForm(false);
  };

  const startAddLesson = (categoryId: string) => {
    const categoryLessons = (lessons || []).filter((l) => l.categoryId === categoryId);
    setShowLessonForm(categoryId);
    setLessonForm({
      ...emptyLessonForm,
      categoryId,
      order: categoryLessons.length + 1,
    });
  };

  // ── Loading / Error ───────────────────────────────────────────

  if (categoriesLoading || lessonsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="p-6 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
        <h3 className="text-heading-sm text-neutral-900 mb-2">
          Failed to load lesson data
        </h3>
        <p className="text-body text-neutral-500">Please try refreshing the page.</p>
      </div>
    );
  }

  const sortedCategories = [...(categories || [])].sort((a, b) => a.order - b.order);

  const lessonsByCategory = (categoryId: string) =>
    [...(lessons || [])]
      .filter((l) => l.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);

  // ── Category Form (shared between create and edit) ────────────

  const renderCategoryForm = (isEditing: boolean) => (
    <div className="p-4 border rounded-lg bg-neutral-50 space-y-3">
      <h4 className="font-semibold text-neutral-900">
        {isEditing ? "Edit Category" : "New Category"}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Name
          </label>
          <input
            type="text"
            value={categoryForm.name}
            onChange={(e) => {
              const name = e.target.value;
              setCategoryForm((prev) => ({
                ...prev,
                name,
                slug: isEditing ? prev.slug : slugify(name),
              }));
            }}
            placeholder="e.g. Tactics"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={categoryForm.slug}
            onChange={(e) =>
              setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="auto-generated"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCategoryForm((prev) => ({ ...prev, color }))}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  categoryForm.color === color
                    ? "border-neutral-900 scale-110"
                    : "border-transparent hover:border-neutral-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Order
          </label>
          <input
            type="number"
            value={categoryForm.order}
            onChange={(e) =>
              setCategoryForm((prev) => ({
                ...prev,
                order: parseInt(e.target.value) || 0,
              }))
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => {
            if (isEditing && editingCategory) {
              updateCategoryMutation.mutate({
                id: editingCategory,
                data: categoryForm,
              });
            } else {
              createCategoryMutation.mutate(categoryForm);
            }
          }}
          disabled={
            !categoryForm.name ||
            !categoryForm.slug ||
            createCategoryMutation.isPending ||
            updateCategoryMutation.isPending
          }
        >
          {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <CheckIcon className="h-4 w-4 mr-1" />
          )}
          {isEditing ? "Update" : "Create"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (isEditing) {
              setEditingCategory(null);
            } else {
              setShowCategoryForm(false);
            }
            setCategoryForm(emptyCategoryForm);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/chess"
          className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Chess Management
        </Link>
        <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
          <BookOpenIcon className="h-8 w-8 text-primary-500" />
          Lesson Management
        </h1>
        <p className="text-body text-neutral-500 mt-1">
          Manage categories, lessons, and their levels
        </p>
      </div>

      {/* ─── Categories Section ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading-sm text-neutral-900 flex items-center gap-2">
            <FolderOpenIcon className="h-5 w-5 text-primary-500" />
            Categories
          </h2>
          {!showCategoryForm && !editingCategory && (
            <Button
              size="sm"
              onClick={() => {
                setShowCategoryForm(true);
                setCategoryForm({
                  ...emptyCategoryForm,
                  order: (categories?.length || 0) + 1,
                });
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          )}
        </div>

        {showCategoryForm && renderCategoryForm(false)}

        <div className="space-y-2 mt-4">
          {sortedCategories.map((cat) => (
            <div key={cat.id}>
              {editingCategory === cat.id ? (
                renderCategoryForm(true)
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-neutral-900">
                          {cat.name}
                        </span>
                        <span className="text-xs text-neutral-400 ml-2">
                          /{cat.slug}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {cat.lessonCount} {cat.lessonCount === 1 ? "lesson" : "lessons"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Order: {cat.order}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditCategory(cat)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (cat.lessonCount > 0) {
                              toast.error(
                                "Cannot delete a category that has lessons. Remove lessons first."
                              );
                              return;
                            }
                            deleteCategoryMutation.mutate(cat.id);
                          }}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4 text-error" />
                        </Button>
                        <button
                          onClick={() =>
                            setExpandedCategory(
                              expandedCategory === cat.id ? null : cat.id
                            )
                          }
                          className="p-1 text-neutral-400 hover:text-neutral-600"
                        >
                          {expandedCategory === cat.id ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <div className="text-center py-8">
              <FolderOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No categories yet</p>
              <p className="text-sm text-neutral-400">
                Create a category to start organizing lessons
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Lessons Section (grouped by category) ──────────────── */}
      <div>
        <h2 className="text-heading-sm text-neutral-900 flex items-center gap-2 mb-4">
          <Square3Stack3DIcon className="h-5 w-5 text-primary-500" />
          Lessons
        </h2>

        {sortedCategories.length === 0 ? (
          <div className="text-center py-8">
            <BookOpenIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">Create categories first to add lessons</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((cat) => {
              const catLessons = lessonsByCategory(cat.id);
              const isExpanded = expandedCategory === cat.id || expandedCategory === null;

              return (
                <Card key={cat.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <h3 className="font-semibold text-neutral-900">
                          {cat.name}
                        </h3>
                        <span className="text-sm text-neutral-500">
                          ({catLessons.length} {catLessons.length === 1 ? "lesson" : "lessons"})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startAddLesson(cat.id)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Lesson
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      {/* Add lesson form */}
                      {showLessonForm === cat.id && (
                        <div className="mb-4 p-4 border rounded-lg bg-neutral-50 space-y-3">
                          <h4 className="font-semibold text-neutral-900">New Lesson</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                Emoji Icon
                              </label>
                              <input
                                type="text"
                                value={lessonForm.iconEmoji}
                                onChange={(e) =>
                                  setLessonForm((prev) => ({
                                    ...prev,
                                    iconEmoji: e.target.value,
                                  }))
                                }
                                placeholder="e.g. &#x265E;"
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
                                onChange={(e) =>
                                  setLessonForm((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Knight Forks"
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
                                onChange={(e) =>
                                  setLessonForm((prev) => ({
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
                              Subtitle
                            </label>
                            <input
                              type="text"
                              value={lessonForm.subtitle}
                              onChange={(e) =>
                                setLessonForm((prev) => ({
                                  ...prev,
                                  subtitle: e.target.value,
                                }))
                              }
                              placeholder="e.g. Learn to attack two pieces at once"
                              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                createLessonMutation.mutate(lessonForm)
                              }
                              disabled={
                                !lessonForm.title ||
                                createLessonMutation.isPending
                              }
                            >
                              {createLessonMutation.isPending ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CheckIcon className="h-4 w-4 mr-1" />
                              )}
                              Create Lesson
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowLessonForm(null);
                                setLessonForm(emptyLessonForm);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lesson list */}
                      {catLessons.length > 0 ? (
                        <div className="space-y-2">
                          {catLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                            >
                              <span className="text-2xl w-10 text-center flex-shrink-0">
                                {lesson.iconEmoji || "--"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-neutral-900 truncate">
                                  {lesson.title}
                                </p>
                                {lesson.subtitle && (
                                  <p className="text-sm text-neutral-500 truncate">
                                    {lesson.subtitle}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 flex-shrink-0">
                                {lesson.levelCount} {lesson.levelCount === 1 ? "level" : "levels"}
                              </span>
                              <Link href={`/admin/chess/lessons/${lesson.id}`}>
                                <Button variant="ghost" size="sm">
                                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-neutral-400">
                            No lessons in this category yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
