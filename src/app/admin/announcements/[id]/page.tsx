"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { useOrganizations } from "@/hooks/useOrganizations";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  USER_ROLE_LABELS,
  AnnouncementType,
  UserRole,
} from "@/lib/validations/announcement";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: announcement, isLoading: isLoadingAnnouncement } = useAnnouncement(id);
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "ANNOUNCEMENT" as AnnouncementType,
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    organizationId: null as string | null,
    targetRoles: [] as UserRole[],
    isPinned: false,
    publishDate: "",
    expiresAt: "",
    isActive: true,
  });

  const [deleteDialog, setDeleteDialog] = useState(false);

  // Populate form when announcement loads
  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type as AnnouncementType,
        imageUrl: announcement.imageUrl || "",
        linkUrl: announcement.linkUrl || "",
        linkText: announcement.linkText || "",
        organizationId: announcement.organizationId,
        targetRoles: announcement.targetRoles as UserRole[],
        isPinned: announcement.isPinned,
        publishDate: format(new Date(announcement.publishDate), "yyyy-MM-dd'T'HH:mm"),
        expiresAt: announcement.expiresAt
          ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm")
          : "",
        isActive: announcement.isActive,
      });
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...formData,
          imageUrl: formData.imageUrl || null,
          linkUrl: formData.linkUrl || null,
          linkText: formData.linkText || null,
          publishDate: new Date(formData.publishDate).toISOString(),
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        },
      });
      toast.success("Announcement updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update announcement");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Announcement deleted successfully");
      router.push("/admin/announcements");
    } catch {
      toast.error("Failed to delete announcement");
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const selectAllRoles = () => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: Object.keys(USER_ROLE_LABELS) as UserRole[],
    }));
  };

  const clearAllRoles = () => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: [],
    }));
  };

  if (isLoadingAnnouncement) {
    return (
      <div className="p-6">
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Announcement not found</p>
        <Link href="/admin/announcements" className="text-primary-500 hover:underline">
          Back to Announcements
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/announcements"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Announcements
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-heading-lg text-neutral-900">Edit Announcement</h1>
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

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Announcement Details</h2>
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
                placeholder="e.g., New Chess Tournament Dates"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={6}
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Write your announcement content here..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      type: e.target.value as AnnouncementType,
                    })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(ANNOUNCEMENT_TYPE_LABELS).map(([value, label]) => (
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

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Target Audience</h2>
            <p className="text-body-sm text-neutral-500">
              Select which user roles can see this announcement
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button type="button" variant="outline" size="sm" onClick={selectAllRoles}>
                Select All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearAllRoles}>
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(USER_ROLE_LABELS) as [UserRole, string][]).map(
                ([role, label]) => (
                  <label
                    key={role}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                      formData.targetRoles.includes(role)
                        ? "border-primary-500 bg-primary-50"
                        : "border-border hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-body-sm font-medium text-neutral-700">
                      {label}
                    </span>
                  </label>
                )
              )}
            </div>
            {formData.targetRoles.length === 0 && (
              <p className="text-body-sm text-error mt-2">
                At least one target role is required
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Links &amp; Media</h2>
            <p className="text-body-sm text-neutral-500">
              Optional: Add an image or link to your announcement
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="imageUrl"
                className="block text-body-sm font-medium text-neutral-700 mb-1"
              >
                Image URL
              </label>
              <input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="linkUrl"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Link URL
                </label>
                <input
                  id="linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., https://example.com/more-info"
                />
              </div>
              <div>
                <label
                  htmlFor="linkText"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Link Text
                </label>
                <input
                  id="linkText"
                  type="text"
                  value={formData.linkText}
                  onChange={(e) =>
                    setFormData({ ...formData, linkText: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Learn More"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Scheduling</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="publishDate"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Publish Date *
                </label>
                <input
                  id="publishDate"
                  type="datetime-local"
                  value={formData.publishDate}
                  onChange={(e) =>
                    setFormData({ ...formData, publishDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="expiresAt"
                  className="block text-body-sm font-medium text-neutral-700 mb-1"
                >
                  Expiration Date (optional)
                </label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-[var(--radius-input)] border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-caption text-neutral-500 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) =>
                    setFormData({ ...formData, isPinned: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-border text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="text-body font-medium text-neutral-900">
                    Pin to top
                  </span>
                  <p className="text-body-sm text-neutral-500">
                    Display prominently at the top of announcements
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

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
                  When active, this announcement will be visible based on scheduling and target roles
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/admin/announcements">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              updateMutation.isPending ||
              !formData.title ||
              !formData.content ||
              formData.targetRoles.length === 0
            }
          >
            {updateMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            CheckIcon Changes
          </Button>
        </div>
      </form>

      <DeleteConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action will make the announcement inactive."
        itemName={announcement.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
