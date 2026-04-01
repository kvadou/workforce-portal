"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  PrinterIcon,
  SwatchIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  useLesson,
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from "@/hooks/useLessons";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MaterialFormData {
  title: string;
  type: "EXERCISE_PAGE" | "COLORING_PAGE";
  pageCount: number;
  fileUrl: string;
  thumbnailUrl: string;
}

export default function MaterialsPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: lesson, isLoading: lessonLoading } = useLesson(id);
  const { data: materials, isLoading: materialsLoading } = useMaterials(id);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<MaterialFormData>({
    title: "",
    type: "EXERCISE_PAGE",
    pageCount: 1,
    fileUrl: "",
    thumbnailUrl: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    materialId: string;
    materialName: string;
  }>({ isOpen: false, materialId: "", materialName: "" });

  const resetForm = () => {
    setFormData({
      title: "",
      type: "EXERCISE_PAGE",
      pageCount: 1,
      fileUrl: "",
      thumbnailUrl: "",
    });
    setEditingMaterial(null);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (material: {
    id: string;
    title: string;
    type: "EXERCISE_PAGE" | "COLORING_PAGE";
    pageCount: number | null;
    fileUrl: string;
    thumbnailUrl: string | null;
  }) => {
    setFormData({
      title: material.title,
      type: material.type,
      pageCount: material.pageCount || 1,
      fileUrl: material.fileUrl,
      thumbnailUrl: material.thumbnailUrl || "",
    });
    setEditingMaterial(material.id);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        title: formData.title,
        type: formData.type,
        pageCount: formData.pageCount,
        fileUrl: formData.fileUrl,
        thumbnailUrl: formData.thumbnailUrl || null,
      };

      if (editingMaterial) {
        await updateMutation.mutateAsync({
          lessonId: id,
          materialId: editingMaterial,
          data,
        });
        toast.success("Material updated");
      } else {
        await createMutation.mutateAsync({ lessonId: id, data });
        toast.success("Material created");
      }
      resetForm();
    } catch {
      toast.error(editingMaterial ? "Failed to update material" : "Failed to create material");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        lessonId: id,
        materialId: deleteDialog.materialId,
      });
      toast.success("Material deleted");
      setDeleteDialog({ isOpen: false, materialId: "", materialName: "" });
    } catch {
      toast.error("Failed to delete material");
    }
  };

  if (lessonLoading || materialsLoading) {
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
            <div className="h-12 w-12 bg-error-light rounded-[var(--radius-lg)] flex items-center justify-center">
              <PrinterIcon className="h-6 w-6 text-error" />
            </div>
            <div>
              <h1 className="text-heading-lg text-neutral-900">Print Materials</h1>
              <p className="text-body text-neutral-500">
                Lesson {lesson?.number}: {lesson?.title}
              </p>
            </div>
          </div>
          {!isCreating && !editingMaterial && (
            <Button onClick={handleStartCreate}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials List */}
        <div className="space-y-4">
          <h2 className="text-heading-sm text-neutral-900">
            {materials?.length || 0} Materials
          </h2>

          {materials?.length === 0 && !isCreating ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PrinterIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-heading-sm text-neutral-900 mb-2">
                  No print materials yet
                </h3>
                <p className="text-body text-neutral-500 mb-6">
                  Add worksheets, coloring pages, and other printables
                </p>
                <Button onClick={handleStartCreate}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {materials?.map((material) => (
                <Card
                  key={material.id}
                  className={`transition-all overflow-hidden ${
                    editingMaterial === material.id
                      ? "ring-2 ring-primary-500"
                      : "hover:shadow-card-hover"
                  }`}
                >
                  <div className="flex">
                    {/* Thumbnail or Icon */}
                    <div
                      className={`w-24 flex-shrink-0 flex items-center justify-center relative ${
                        material.type === "COLORING_PAGE"
                          ? "bg-primary-100"
                          : "bg-info-light"
                      }`}
                    >
                      {material.thumbnailUrl ? (
                        <Image
                          src={material.thumbnailUrl}
                          alt={material.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : material.type === "COLORING_PAGE" ? (
                        <SwatchIcon className="h-8 w-8 text-primary-500" />
                      ) : (
                        <DocumentTextIcon className="h-8 w-8 text-info" />
                      )}
                    </div>
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900">
                              {material.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-lg ${
                                material.type === "COLORING_PAGE"
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-info-light text-info-dark"
                              }`}
                            >
                              {material.type === "COLORING_PAGE"
                                ? "Coloring"
                                : "Exercise"}
                            </span>
                          </div>
                          <p className="text-body-sm text-neutral-500">
                            {material.pageCount} page{material.pageCount !== 1 ? "s" : ""}
                          </p>
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-body-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-1"
                          >
                            View PDF
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(material)}
                            className="p-2 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded-[var(--radius-md)] transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                materialId: material.id,
                                materialName: material.title,
                              })
                            }
                            className="p-2 text-neutral-400 hover:text-error hover:bg-error-light rounded-[var(--radius-md)] transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit/Create Form */}
        {(isCreating || editingMaterial) && (
          <Card className="h-fit sticky top-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-heading-sm text-neutral-900">
                {editingMaterial ? "Edit Material" : "New Material"}
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
                    placeholder="e.g., King Movement Worksheet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="type"
                      className="block text-body-sm font-medium text-neutral-700 mb-1"
                    >
                      Type *
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "EXERCISE_PAGE" | "COLORING_PAGE",
                        })
                      }
                      className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="EXERCISE_PAGE">Exercise Page</option>
                      <option value="COLORING_PAGE">Coloring Page</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="pageCount"
                      className="block text-body-sm font-medium text-neutral-700 mb-1"
                    >
                      Pages
                    </label>
                    <input
                      id="pageCount"
                      type="number"
                      min="1"
                      value={formData.pageCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pageCount: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fileUrl"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    PDF URL *
                  </label>
                  <input
                    id="fileUrl"
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com/worksheet.pdf"
                  />
                </div>

                <div>
                  <label
                    htmlFor="thumbnailUrl"
                    className="block text-body-sm font-medium text-neutral-700 mb-1"
                  >
                    Thumbnail URL
                  </label>
                  <input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnailUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://example.com/thumbnail.jpg"
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
                      !formData.fileUrl
                    }
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {editingMaterial ? "Update" : "Create"}
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
          setDeleteDialog({ isOpen: false, materialId: "", materialName: "" })
        }
        onConfirm={handleDelete}
        title="Delete Material"
        description="Are you sure you want to delete this material? This action cannot be undone."
        itemName={deleteDialog.materialName}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
