"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  EyeIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useResource, useUpdateResource, useDeleteResource } from "@/hooks/useResources";
import { useOrganizations } from "@/hooks/useOrganizations";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  ResourceCategory,
  ResourceType,
  Visibility,
} from "@/lib/validations/resource";
import { toast } from "sonner";
import { CanvaDesignPicker } from "@/components/admin/CanvaDesignPicker";

// Dynamic import for BlockNote to avoid SSR issues
const BlockEditor = dynamic(
  () => import("@/components/editor/BlockEditor").then((mod) => mod.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[300px] bg-neutral-50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-neutral-400">Loading editor...</span>
      </div>
    ),
  }
);

// Map categories to their front-end URLs
const categoryToUrl: Record<string, string> = {
  // Teaching
  VIDEO_LIBRARY: "/teaching/video-library",
  MINI_GAMES: "/teaching/mini-games",
  STORY_ILLUSTRATIONS: "/teaching/story-illustrations",
  PRINTABLE_ACTIVITIES: "/teaching/printable-activities",
  SONGS: "/teaching/songs",
  CHESS_RESOURCES: "/teaching/chess-resources",
  BQ_RESOURCES: "/teaching/adventures-resources",
  ONLINE_TEACHING: "/teaching/online-teaching",
  BEHAVIOR_MANAGEMENT: "/teaching/behavior-management",
  // Business
  EMAIL_TEMPLATES: "/business/email-templates",
  FLIER_TEMPLATES: "/business/flier-templates",
  REFERRAL_STRATEGIES: "/business/referral-strategies",
  CLIENT_COMMUNICATION: "/business/client-communication",
  TUTOR_SUPPLIES: "/business/tutor-supplies",
  // Admin
  ADMIN_TEAM: "/resources/admin-team",
  CLUB_LOCATIONS: "/resources/clubs",
  FORMS: "/resources/forms",
  CHESSPECTATIONS: "/resources/chesspectations",
  ADMIN_VIDEO_TUTORIALS: "/resources/admin-video-tutorials",
  DEIB_POLICIES: "/resources/deib-policies",
  LESSON_REPORTS: "/resources/lesson-reports",
  REFERRAL_GUIDELINES: "/resources/referral-guidelines",
};

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const { data: resource, isLoading: isLoadingResource } = useResource(id);
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "VIDEO_LIBRARY" as ResourceCategory,
    type: "RICH_TEXT" as ResourceType,
    url: "",
    fileUrl: "",
    thumbnailUrl: "",
    content: "",
    organizationId: null as string | null,
    visibility: "ALL_TUTORS" as Visibility,
    isActive: true,
  });

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [canvaPickerOpen, setCanvaPickerOpen] = useState(false);

  // Populate form when resource loads
  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description || "",
        category: resource.category as ResourceCategory,
        type: resource.type as ResourceType,
        url: resource.url || "",
        fileUrl: resource.fileUrl || "",
        thumbnailUrl: resource.thumbnailUrl || "",
        content: resource.content || "",
        organizationId: resource.organizationId,
        visibility: resource.visibility as Visibility,
        isActive: resource.isActive,
      });
    }
  }, [resource]);

  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...formData,
          url: formData.url || null,
          fileUrl: formData.fileUrl || null,
          thumbnailUrl: formData.thumbnailUrl || null,
          content: formData.content || null,
          description: formData.description || null,
        },
      });
      toast.success("Resource updated successfully");

      // Redirect back to the page they came from, or the category page
      if (returnTo) {
        router.push(returnTo);
      } else {
        const categoryUrl = categoryToUrl[formData.category];
        if (categoryUrl) {
          router.push(categoryUrl);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update resource");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Resource deleted successfully");
      router.push("/admin/resources");
    } catch {
      toast.error("Failed to delete resource");
    }
  };

  const viewPageUrl = resource ? categoryToUrl[resource.category] : null;

  if (isLoadingResource) {
    return (
      <div className="p-6">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Resource not found</p>
        <Link href="/admin/resources" className="text-primary-500 hover:underline">
          Back to Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <Link
          href={returnTo || "/admin/resources"}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {returnTo ? "Back to Page" : "Back to Resources"}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-heading-lg text-neutral-900">Edit Resource</h1>
          <div className="flex items-center gap-2">
            {viewPageUrl && (
              <Link href={viewPageUrl} target="_blank">
                <Button variant="outline">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Page
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(true)}
              className="text-error border-error hover:bg-error-light"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Resource Details</h2>
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
                placeholder="e.g., Chess Opening Strategies Video"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Short Description (for listings)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Brief description shown in resource listings..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as ResourceCategory,
                    })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(CATEGORY_GROUPS).map(([groupKey, group]) => (
                    <optgroup key={groupKey} label={group.label}>
                      {group.categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

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
                      type: e.target.value as ResourceType,
                    })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="visibility"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibility: e.target.value as Visibility,
                    })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="organizationId"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Organization
                </label>
                <select
                  id="organizationId"
                  value={formData.organizationId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationId: e.target.value || null,
                    })
                  }
                  disabled={orgsLoading}
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="">Shared (All Organizations)</option>
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.isHQ ? "(HQ)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Page Content</h2>
            <p className="text-body-sm text-neutral-500">
              Use the editor below to create rich content. Type <code className="bg-neutral-100 px-1 rounded">/</code> to see available blocks.
            </p>
          </CardHeader>
          <CardContent>
            <BlockEditor
              initialContent={formData.content}
              onChange={handleEditorChange}
              placeholder="Start typing your content here..."
            />
          </CardContent>
        </Card>

        {/* Media & Links */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Media &amp; Links</h2>
            <p className="text-body-sm text-neutral-500">
              Add external URLs, files, or thumbnails
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.type === "CANVA_DESIGN" && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">Canva Design</h3>
                    <p className="text-sm text-neutral-500">
                      {formData.url ? "Design selected" : "Select a design from your Canva account"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCanvaPickerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {formData.url ? "Change Design" : "Select from Canva"}
                </button>
                <CanvaDesignPicker
                  isOpen={canvaPickerOpen}
                  onClose={() => setCanvaPickerOpen(false)}
                  onSelect={(design) => {
                    setFormData({
                      ...formData,
                      url: design.embedUrl,
                      title: formData.title || design.title,
                      thumbnailUrl: design.thumbnail?.url || formData.thumbnailUrl,
                    });
                    setCanvaPickerOpen(false);
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  External URL (Video, Link)
                </label>
                <input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., https://vimeo.com/123456789"
                />
              </div>

              <div>
                <label
                  htmlFor="fileUrl"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  File URL (PDF, PhotoIcon)
                </label>
                <input
                  id="fileUrl"
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, fileUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., https://s3.amazonaws.com/bucket/file.pdf"
                />
              </div>
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
                placeholder="e.g., https://s3.amazonaws.com/bucket/thumbnail.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Status</h2>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-5 w-5 rounded border-border text-primary-500 focus:ring-primary-500"
              />
              <div>
                <span className="text-body font-medium text-neutral-900">
                  Active
                </span>
                <p className="text-body-sm text-neutral-500">
                  When active, this resource will be visible to users
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Sticky CheckIcon Bar */}
        <div className="sticky bottom-0 bg-white border-t border-border py-4 -mx-8 px-8 flex justify-end gap-3">
          <Link href={returnTo || "/admin/resources"}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={updateMutation.isPending || !formData.title}
            className="min-w-[140px]"
          >
            {updateMutation.isPending ? (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-2" />
            )}
            CheckIcon Changes
          </Button>
        </div>
      </form>

      <DeleteConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Resource"
        description="Are you sure you want to delete this resource? This action will make the resource inactive."
        itemName={resource.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
