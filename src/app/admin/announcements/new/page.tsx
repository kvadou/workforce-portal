"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateAnnouncement } from "@/hooks/useAnnouncements";
import { useOrganizations } from "@/hooks/useOrganizations";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  USER_ROLE_LABELS,
  AnnouncementType,
  UserRole,
} from "@/lib/validations/announcement";
import { toast } from "sonner";
import { format } from "date-fns";
import { TemplateSelector, ContentTemplate } from "@/components/editor/ContentTemplates";

// Dynamic import for BlockNote to avoid SSR issues
const BlockEditor = dynamic(
  () => import("@/components/editor/BlockEditor").then((mod) => mod.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] bg-neutral-50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-neutral-400">Loading editor...</span>
      </div>
    ),
  }
);

export default function NewAnnouncementPage() {
  const router = useRouter();
  const createMutation = useCreateAnnouncement();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();

  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    htmlContent: "",
    type: "ANNOUNCEMENT" as AnnouncementType,
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    organizationId: null as string | null,
    targetRoles: ["TUTOR", "LEAD_TUTOR", "FRANCHISEE_OWNER", "ADMIN", "SUPER_ADMIN"] as UserRole[],
    isPinned: false,
    publishDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    expiresAt: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newAnnouncement = await createMutation.mutateAsync({
        ...formData,
        imageUrl: formData.imageUrl || null,
        linkUrl: formData.linkUrl || null,
        linkText: formData.linkText || null,
        publishDate: new Date(formData.publishDate).toISOString(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      });
      toast.success("Announcement created successfully");
      router.push(`/admin/announcements/${newAnnouncement.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create announcement");
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

  const handleTemplateSelect = (template: ContentTemplate) => {
    setFormData({
      ...formData,
      content: JSON.stringify(template.blocks),
    });
    setShowTemplates(false);
  };

  const handleEditorChange = (content: string, html: string) => {
    setFormData({
      ...formData,
      content,
      htmlContent: html,
    });
  };

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
          <h1 className="text-heading-lg text-neutral-900">Create New Announcement</h1>
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
            <SparklesIcon className="h-4 w-4 mr-2" />
            {showTemplates ? "Hide Templates" : "Use Template"}
          </Button>
        </div>
      </div>

      {showTemplates && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Choose a Template</h2>
            <p className="text-body-sm text-neutral-500">
              Select a template to start with pre-built content
            </p>
          </CardHeader>
          <CardContent>
            <TemplateSelector onSelect={handleTemplateSelect} category="announcement" />
          </CardContent>
        </Card>
      )}

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

        {/* Content Editor */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-heading-sm text-neutral-900">Content</h2>
            <p className="text-body-sm text-neutral-500">
              Use the editor below to create rich content. Type <code className="bg-neutral-100 px-1 rounded">/</code> to see available blocks.
            </p>
          </CardHeader>
          <CardContent>
            <BlockEditor
              initialContent={formData.content}
              onChange={handleEditorChange}
              placeholder="Write your announcement content here..."
            />
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

            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              createMutation.isPending ||
              !formData.title ||
              !formData.content ||
              formData.targetRoles.length === 0
            }
          >
            {createMutation.isPending && (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            )}
            <CheckIcon className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      </form>
    </div>
  );
}
