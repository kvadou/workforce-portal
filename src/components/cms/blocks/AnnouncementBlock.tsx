"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  MegaphoneIcon,
  ArrowUpTrayIcon,
  PhotoIcon as ImageIcon,
  ArrowPathIcon,
  LinkIcon,
  FolderOpenIcon,
  BoltIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { MediaLibrary } from "../MediaLibrary";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";

interface AnnouncementBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function AnnouncementBlock({ block, isEditing }: AnnouncementBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    title: string;
    body: string;
    imageUrl?: string;
    linkUrl?: string;
    linkText?: string;
  };
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl, filename } = await urlResponse.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Save to database
        await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filename || file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: fileUrl,
            thumbnailUrl: fileUrl,
          }),
        });

        updateBlock(block.id, { imageUrl: fileUrl });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [block.id, updateBlock]
  );

  const handleMediaSelect = (url: string) => {
    updateBlock(block.id, { imageUrl: url });
    setShowMediaLibrary(false);
  };

  if (isEditing) {
    return (
      <>
        {/* Preview matching view mode exactly */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-success-light/50 border border-success border-dashed">
          {/* Image at top if present */}
          {content.imageUrl ? (
            <div className="relative overflow-hidden aspect-video group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.imageUrl}
                alt={content.title || "Announcement"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              {/* Remove button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowMediaLibrary(true)}
                  className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium hover:bg-neutral-100"
                >
                  Change
                </button>
                <button
                  onClick={() => updateBlock(block.id, { imageUrl: undefined })}
                  className="px-3 py-1.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error-dark"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMediaLibrary(true)}
              className="w-full h-32 bg-success-light flex flex-col items-center justify-center text-success hover:text-success hover:bg-success-light transition-colors"
            >
              {isUploading ? (
                <ArrowPathIcon className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm mt-1">Add Image</span>
                </>
              )}
            </button>
          )}

          <div className="p-6">
            {/* Editable title */}
            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Announcement title..."
              className="w-full text-xl font-bold text-neutral-900 bg-transparent border-b-2 border-dashed border-success hover:border-success focus:border-success focus:outline-none placeholder:text-neutral-400 mb-3"
            />

            {/* Editable body */}
            <textarea
              value={content.body || ""}
              onChange={(e) => updateBlock(block.id, { body: e.target.value })}
              placeholder="Announcement content..."
              rows={3}
              className="w-full text-neutral-600 bg-transparent border border-dashed border-neutral-200 hover:border-neutral-300 focus:border-success focus:outline-none rounded-lg p-2 resize-none leading-relaxed"
            />

            {/* Link section */}
            <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-3">
              <LinkIcon className="h-4 w-4 text-success flex-shrink-0" />
              <input
                type="url"
                value={content.linkUrl || ""}
                onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })}
                placeholder="Link URL (optional)"
                className="flex-1 text-sm bg-transparent border-b border-dashed border-neutral-200 hover:border-neutral-300 focus:border-success focus:outline-none text-neutral-600 placeholder:text-neutral-400"
              />
              <input
                type="text"
                value={content.linkText || ""}
                onChange={(e) => updateBlock(block.id, { linkText: e.target.value })}
                placeholder="Link text"
                className="w-28 text-sm bg-success-light border border-success rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-success text-success font-medium"
              />
              {content.linkUrl && (
                <ArrowRightIcon className="h-4 w-4 text-success flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Media Library Modal */}
        <MediaLibrary
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
          allowedTypes={["image"]}
        />
      </>
    );
  }

  // View mode - Stunning design with shadows and gradients
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-success-light/50 border border-success hover:shadow-card-hover hover:shadow-success-light/50 transition-all duration-300 group">
      {/* Image at top if present */}
      {content.imageUrl && (
        <div className="relative overflow-hidden aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.imageUrl}
            alt={content.title || "Announcement"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="p-6">
        <h4 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-success transition-colors line-clamp-2">
          {content.title}
        </h4>
        {content.body && (
          <div
            className="prose prose-neutral prose-sm max-w-none text-neutral-600 leading-relaxed line-clamp-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }}
          />
        )}
        {content.linkUrl && (
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <a
              href={content.linkUrl}
              className="inline-flex items-center gap-2 text-success hover:text-success-dark font-semibold text-sm group/link"
            >
              <span>{content.linkText || "Read more"}</span>
              <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
