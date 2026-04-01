"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  EyeIcon,
  GlobeAltIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CMSWrapper } from "@/components/cms/CMSWrapper";
import { CMSPageRenderer } from "@/components/cms/CMSPageRenderer";
import { PageStatusBadge } from "@/components/admin/pages/PageStatusBadge";
import { usePage, useUpdatePage, usePublishPage, useDeletePage } from "@/hooks/usePages";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  PageCategory,
  PageStatus,
  PAGE_CATEGORY_LABELS,
  VISIBILITY_LABELS,
  Visibility,
  generateSlug,
} from "@/lib/validations/page";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function PageEditorPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  const { data: page, isLoading: pageLoading, error } = usePage(pageId);
  const { data: organizations } = useOrganizations();
  const updateMutation = useUpdatePage();
  const publishMutation = usePublishPage();
  const deleteMutation = useDeletePage();

  // Local form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(true);
  const [description, setDescription] = useState("");
  const [pageCategory, setPageCategory] = useState<PageCategory>("CUSTOM");
  const [visibility, setVisibility] = useState<Visibility>("ALL_TUTORS");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");

  // UI state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "seo">("general");
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load page data into form
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setDescription(page.description || "");
      setPageCategory(page.pageCategory as PageCategory);
      setVisibility(page.visibility as Visibility);
      setOrganizationId(page.organizationId);
      setSeoTitle(page.seoTitle || "");
      setNoIndex(page.noIndex);
      setFeaturedImage(page.featuredImage || "");
      setHasLocalChanges(false);
    }
  }, [page]);

  // Track changes
  const handleFieldChange = () => {
    setHasLocalChanges(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited && !page?.publishedAt) {
      setSlug(generateSlug(value));
    }
    handleFieldChange();
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(generateSlug(value));
    handleFieldChange();
  };

  // CheckIcon page metadata
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: pageId,
        data: {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          pageCategory,
          visibility,
          organizationId,
          seoTitle: seoTitle.trim() || null,
          noIndex,
          featuredImage: featuredImage.trim() || null,
        },
      });
      setHasLocalChanges(false);
      toast.success("Page settings saved");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast.error(message);
    }
  };

  // Publish page
  const handlePublish = async () => {
    // CheckIcon settings first
    await handleSave();

    try {
      await publishMutation.mutateAsync({
        id: pageId,
        data: { action: "publish" },
      });
      toast.success("Page published!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to publish";
      toast.error(message);
    }
  };

  // Unpublish page
  const handleUnpublish = async () => {
    try {
      await publishMutation.mutateAsync({
        id: pageId,
        data: { action: "unpublish" },
      });
      toast.success("Page unpublished");
    } catch {
      toast.error("Failed to unpublish");
    }
  };

  // Delete page
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: pageId, hard: true });
      toast.success("Page deleted");
      router.push("/admin/pages");
    } catch {
      toast.error("Failed to delete page");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-500">Loading page editor...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-error mx-auto mb-4" />
            <h1 className="text-heading-sm text-neutral-900 mb-2">Page Not Found</h1>
            <p className="text-neutral-500 mb-6">
              The page you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/admin/pages">
              <Button>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Pages
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPublished = page.status === "PUBLISHED";
  const categoryOptions: PageCategory[] = ["TEACHING", "BUSINESS", "ADMIN", "ONBOARDING", "CUSTOM"];
  const visibilityOptions: Visibility[] = ["ALL_TUTORS", "LEAD_TUTORS", "FRANCHISEE_OWNERS", "ADMINS_ONLY"];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Top Header Bar - Polished Design */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-[1800px] mx-auto">
          {/* Left: Back Button & Page Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/pages"
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-neutral-500" />
            </Link>

            <div className="hidden sm:block w-px h-8 bg-neutral-200" />

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Page Title"
                  className="text-lg font-semibold text-neutral-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 max-w-[300px] truncate placeholder:text-neutral-400"
                />
                <PageStatusBadge status={page.status as PageStatus} />
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500 mt-0.5">
                <span className="font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded">
                  /p/{slug || "page-slug"}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Cog6ToothIcon Toggle */}
            <Button
              variant={settingsPanelOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
            >
              <Cog6ToothIcon className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Cog6ToothIcon</span>
            </Button>

            {/* Preview button */}
            {isPublished && (
              <Link href={`/p/${page.slug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </Link>
            )}

            {/* CheckIcon button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!hasLocalChanges || updateMutation.isPending}
              className={hasLocalChanges ? "border-warning text-warning-dark hover:bg-warning-light" : ""}
            >
              {updateMutation.isPending ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : hasLocalChanges ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  CheckIcon
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Saved
                </>
              )}
            </Button>

            {/* Publish/Unpublish button */}
            {isPublished ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnpublish}
                disabled={publishMutation.isPending}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="glow"
                size="sm"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <GlobeAltIcon className="h-4 w-4 mr-1.5" />
                    Publish
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex max-w-[1800px] mx-auto">
        {/* CMS Editor - Main Area */}
        <div className={`flex-1 transition-all duration-300 ${settingsPanelOpen ? "mr-80" : ""}`}>
          <CMSWrapper pageType="page" pageId={pageId}>
            <div className="p-6 lg:p-8">
              <CMSPageRenderer
                pageType="page"
                pageId={pageId}
                className="max-w-4xl mx-auto"
              />
            </div>
          </CMSWrapper>
        </div>

        {/* Cog6ToothIcon Panel - Slide-in from Right */}
        <div
          className={`fixed right-0 top-[65px] bottom-0 w-full sm:w-80 bg-white border-l border-neutral-200 shadow-dropdown transition-transform duration-300 z-30 overflow-hidden ${
            settingsPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="font-semibold text-neutral-900">Page Cog6ToothIcon</h2>
            <button
              onClick={() => setSettingsPanelOpen(false)}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-neutral-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveSettingsTab("general")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSettingsTab === "general"
                  ? "text-primary-600 border-b-2 border-primary-500"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveSettingsTab("seo")}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeSettingsTab === "seo"
                  ? "text-primary-600 border-b-2 border-primary-500"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              SEO
            </button>
          </div>

          {/* Panel Content */}
          <div className="p-4 overflow-y-auto h-[calc(100vh-200px)]">
            {activeSettingsTab === "general" ? (
              <div className="space-y-5">
                {/* URL Slug */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    URL Slug
                  </label>
                  <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
                    <span className="text-sm text-neutral-400 pl-3">/p/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm font-mono bg-transparent border-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      handleFieldChange();
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Brief page description..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={pageCategory}
                    onChange={(e) => {
                      setPageCategory(e.target.value as PageCategory);
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {PAGE_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => {
                      setVisibility(e.target.value as Visibility);
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {visibilityOptions.map((vis) => (
                      <option key={vis} value={vis}>
                        {VISIBILITY_LABELS[vis]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Organization
                  </label>
                  <select
                    value={organizationId || ""}
                    onChange={(e) => {
                      setOrganizationId(e.target.value || null);
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Organizations</option>
                    {organizations?.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Featured Image
                  </label>
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => {
                      setFeaturedImage(e.target.value);
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                  {featuredImage && (
                    <div className="mt-2 relative aspect-video bg-neutral-100 rounded-lg overflow-hidden">
                      <img
                        src={featuredImage}
                        alt="Featured"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-neutral-200">
                  <h3 className="text-sm font-medium text-error mb-3">Danger Zone</h3>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-error border border-error rounded-lg hover:bg-error-light transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      handleFieldChange();
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={title || "Page title..."}
                    maxLength={70}
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-neutral-500">
                      Appears in search results
                    </p>
                    <p className="text-xs text-neutral-400">
                      {seoTitle.length}/70
                    </p>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Meta Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      handleFieldChange();
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Brief description for search engines..."
                    maxLength={160}
                  />
                  <div className="flex justify-between mt-1.5">
                    <p className="text-xs text-neutral-500">
                      Appears below title in search results
                    </p>
                    <p className="text-xs text-neutral-400">
                      {description.length}/160
                    </p>
                  </div>
                </div>

                {/* No Index */}
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="noIndex"
                    checked={noIndex}
                    onChange={(e) => {
                      setNoIndex(e.target.checked);
                      handleFieldChange();
                    }}
                    className="mt-0.5 rounded border-neutral-300"
                  />
                  <div>
                    <label htmlFor="noIndex" className="text-sm font-medium text-neutral-700 block">
                      Hide from search engines
                    </label>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Adds noindex meta tag to prevent indexing
                    </p>
                  </div>
                </div>

                {/* SEO Preview */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Search Preview
                  </label>
                  <div className="p-3 bg-white border border-neutral-200 rounded-lg">
                    <p className="text-info text-sm font-medium truncate">
                      {seoTitle || title || "Page Title"}
                    </p>
                    <p className="text-success-dark text-xs truncate mt-0.5">
                      workforceportal.com/p/{slug || "page-slug"}
                    </p>
                    <p className="text-neutral-600 text-xs mt-1 line-clamp-2">
                      {description || "No description provided. Add a description to improve search visibility."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Page"
        description={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
