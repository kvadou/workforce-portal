"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  EyeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";

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

interface InlineContentEditorProps {
  resourceId: string;
  publishedContent: string | null;
  draftContent: string | null;
  hasDraft: boolean;
  className?: string;
}

export function InlineContentEditor({
  resourceId,
  publishedContent,
  draftContent,
  hasDraft: initialHasDraft,
  className = "",
}: InlineContentEditorProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(draftContent || publishedContent || "");
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Only show for admin roles
  const isAdmin = session?.user?.role &&
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

  // Determine what content to show
  // Admins see draft if available, tutors always see published
  const displayContent = isAdmin && hasDraft ? (draftContent || publishedContent) : publishedContent;

  const handleEditorChange = useCallback((jsonContent: string, htmlContent: string) => {
    // Store the HTML content for display and saving
    setContent(htmlContent);
  }, []);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftContent: content,
          hasDraft: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      setHasDraft(true);
      toast.success("Draft saved! Only you can see these changes until published.");
    } catch (error) {
      toast.error("Failed to save draft");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content,
          draftContent: null,
          hasDraft: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      setHasDraft(false);
      setIsEditing(false);
      toast.success("Published! Changes are now visible to all tutors.");

      // Refresh the page to show updated content
      window.location.reload();
    } catch (error) {
      toast.error("Failed to publish");
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftContent: null,
          hasDraft: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to discard draft");
      }

      setContent(publishedContent || "");
      setHasDraft(false);
      setIsEditing(false);
      toast.success("Draft discarded");
    } catch (error) {
      toast.error("Failed to discard draft");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to the current draft or published content
    setContent(draftContent || publishedContent || "");
    setIsEditing(false);
  };

  // Non-admins just see the content
  if (!isAdmin) {
    if (!publishedContent) return null;
    return (
      <div
        className={`prose prose-neutral max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(publishedContent) }}
      />
    );
  }

  // Admin view
  return (
    <div className={`relative ${className}`}>
      {/* Draft indicator banner */}
      {hasDraft && !isEditing && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-warning-light border border-warning rounded-lg text-warning-dark">
          <ExclamationCircleIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            You have unpublished changes. Only admins can see this version.
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="text-warning-dark border-warning hover:bg-warning-light"
            >
              <PencilSquareIcon className="h-3 w-3 mr-1" />
              Continue Editing
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-warning hover:bg-warning-dark text-white"
            >
              {isPublishing ? (
                <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <GlobeAltIcon className="h-3 w-3 mr-1" />
              )}
              Publish Now
            </Button>
          </div>
        </div>
      )}

      {isEditing ? (
        /* Edit Mode */
        <div className="border-2 border-primary-300 rounded-xl bg-white">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-50 border-b border-primary-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary-700">Editing Mode</span>
              {hasDraft && (
                <span className="px-2 py-0.5 bg-warning-light text-warning-dark text-xs font-medium rounded">
                  Unpublished Changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1" />
                )}
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-success hover:bg-success-dark"
              >
                {isPublishing ? (
                  <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                )}
                Publish
              </Button>
            </div>
          </div>

          {/* Editor or Preview */}
          <div className="p-4">
            {showPreview ? (
              <div
                className="prose prose-neutral max-w-none
                  prose-headings:text-neutral-900
                  prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6
                  prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2
                  prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-neutral-700 prose-li:mb-1
                  prose-a:text-primary-600 prose-a:hover:text-primary-700 prose-a:underline
                  prose-strong:text-neutral-900
                  prose-img:rounded-lg prose-img:shadow-sm prose-img:my-6"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
              />
            ) : (
              <BlockEditor
                initialContent={content}
                onChange={handleEditorChange}
                placeholder="Start typing your content here..."
              />
            )}
          </div>

          {/* Discard draft option */}
          {hasDraft && (
            <div className="px-4 py-2 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
              <button
                onClick={() => setDiscardConfirmOpen(true)}
                className="text-sm text-error hover:text-error-dark hover:underline"
              >
                Discard draft and revert to published version
              </button>
              <ConfirmDialog
                isOpen={discardConfirmOpen}
                onClose={() => setDiscardConfirmOpen(false)}
                onConfirm={handleDiscardDraft}
                title="Discard Draft"
                message="Are you sure you want to discard your draft? This cannot be undone."
                variant="danger"
                confirmLabel="Discard"
              />
            </div>
          )}
        </div>
      ) : (
        /* View Mode */
        <div className="relative group">
          {/* Content */}
          {displayContent ? (
            <div
              className="prose prose-neutral max-w-none
                prose-headings:text-neutral-900
                prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
                prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6
                prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2
                prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-4
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-neutral-700 prose-li:mb-1
                prose-a:text-primary-600 prose-a:hover:text-primary-700 prose-a:underline
                prose-strong:text-neutral-900
                prose-img:rounded-lg prose-img:shadow-sm prose-img:my-6"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
            />
          ) : (
            <div className="text-neutral-500 italic py-8 text-center">
              No content yet. Click &quot;Edit Page&quot; to add content.
            </div>
          )}

          {/* Floating Edit Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-full shadow-sm hover:bg-primary-700 transition-all hover:scale-105"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span className="font-medium">Edit Page</span>
          </button>
        </div>
      )}
    </div>
  );
}
