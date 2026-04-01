"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  PhotoIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateResource } from "@/hooks/useResources";
import { useOrganizations } from "@/hooks/useOrganizations";
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
import { TemplateSelector, ContentTemplate, contentTemplates } from "@/components/editor/ContentTemplates";
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

export default function NewResourcePage() {
  const router = useRouter();
  const createMutation = useCreateResource();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();

  const [showTemplates, setShowTemplates] = useState(true);
  const [canvaPickerOpen, setCanvaPickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "VIDEO_LIBRARY" as ResourceCategory,
    type: "RICH_TEXT" as ResourceType,
    url: "",
    fileUrl: "",
    thumbnailUrl: "",
    content: "",
    htmlContent: "",
    organizationId: null as string | null,
    visibility: "ALL_TUTORS" as Visibility,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newResource = await createMutation.mutateAsync({
        ...formData,
        url: formData.url || null,
        fileUrl: formData.fileUrl || null,
        thumbnailUrl: formData.thumbnailUrl || null,
        content: formData.content || null,
        description: formData.description || null,
      });
      toast.success("Resource created successfully");
      router.push(`/admin/resources/${newResource.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create resource");
    }
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

  // If showing template selector
  if (showTemplates) {
    return (
      <div className="p-6 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/admin/resources"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Resources
          </Link>
          <h1 className="text-heading-lg text-neutral-900">Create New Resource</h1>
          <p className="text-body text-neutral-500 mt-2">
            Choose a template to get started, or start from scratch
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-heading-sm text-neutral-900">Choose a Template</h2>
                  <p className="text-body-sm text-neutral-500">
                    Templates give you a head start with pre-built content structures
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowTemplates(false)}>
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                Start Blank
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TemplateSelector onSelect={handleTemplateSelect} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <Link
          href="/admin/resources"
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Resources
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-heading-lg text-neutral-900">Create New Resource</h1>
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <SparklesIcon className="h-4 w-4 mr-2" />
            Choose Template
          </Button>
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
                Description (short summary for listings)
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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

        {/* Content Editor - Main Focus */}
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
              placeholder="Start typing or use '/' for commands..."
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

            <div className="grid grid-cols-2 gap-4">
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

        <div className="flex justify-end gap-3">
          <Link href="/admin/resources">
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
            Create Resource
          </Button>
        </div>
      </form>
    </div>
  );
}
