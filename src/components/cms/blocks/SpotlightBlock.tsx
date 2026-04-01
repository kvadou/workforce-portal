"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  BookOpenIcon,
  ArrowUpTrayIcon,
  PhotoIcon as ImageIcon,
  ArrowPathIcon,
  LinkIcon,
  FolderOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { MediaLibrary } from "../MediaLibrary";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";

interface SpotlightBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function SpotlightBlock({ block, isEditing }: SpotlightBlockProps) {
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
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-warning-light/50 border border-warning border-dashed">
          {/* Gradient accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-warning via-accent-orange to-warning" />

          <div className="p-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-warning-light to-accent-orange-light rounded-full mb-4">
              <SparklesIcon className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-bold text-warning-dark uppercase tracking-wide">Story Spotlight</span>
            </div>

            {/* Editable title */}
            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Spotlight title..."
              className="w-full text-xl font-bold text-neutral-900 bg-transparent border-b-2 border-dashed border-warning hover:border-warning focus:border-warning focus:outline-none placeholder:text-neutral-400 mb-3"
            />

            {/* Image section */}
            {content.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl mb-4 aspect-video group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.imageUrl}
                  alt={content.title || "Spotlight"}
                  className="w-full h-full object-cover"
                />
                {/* Overlay with change/remove buttons */}
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
                className="w-full h-32 bg-warning-light rounded-xl flex flex-col items-center justify-center text-warning hover:text-warning hover:bg-warning-light transition-colors mb-4"
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

            {/* Editable body */}
            <textarea
              value={content.body || ""}
              onChange={(e) => updateBlock(block.id, { body: e.target.value })}
              placeholder="Write about this spotlight..."
              rows={3}
              className="w-full text-neutral-600 bg-transparent border border-dashed border-neutral-200 hover:border-neutral-300 focus:border-warning focus:outline-none rounded-lg p-2 resize-none leading-relaxed"
            />

            {/* Link section */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-warning flex-shrink-0" />
                <input
                  type="url"
                  value={content.linkUrl || ""}
                  onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })}
                  placeholder="Link URL (optional)"
                  className="flex-1 text-sm bg-transparent border-b border-dashed border-neutral-200 hover:border-neutral-300 focus:border-warning focus:outline-none text-neutral-600 placeholder:text-neutral-400"
                />
              </div>
              {content.linkUrl && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warning-light to-accent-orange text-white font-semibold text-sm rounded-xl shadow-sm shadow-warning-light/50">
                  <input
                    type="text"
                    value={content.linkText || ""}
                    onChange={(e) => updateBlock(block.id, { linkText: e.target.value })}
                    placeholder="Explore Story"
                    className="bg-transparent border-none focus:outline-none text-white placeholder:text-white/70 w-28"
                  />
                  <ArrowRightIcon className="h-4 w-4" />
                </div>
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

  // View mode - Stunning design with gradient accent bar
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-warning-light/50 border border-warning group hover:shadow-card-hover hover:shadow-warning-light/50 transition-all duration-300">
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-warning via-accent-orange to-warning" />

      <div className="p-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-warning-light to-accent-orange-light rounded-full mb-4">
          <SparklesIcon className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-bold text-warning-dark uppercase tracking-wide">Story Spotlight</span>
        </div>

        <h4 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-warning transition-colors">
          {content.title}
        </h4>

        {content.imageUrl && (
          <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.imageUrl}
              alt={content.title || "Spotlight"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {content.body && (
          <div
            className="prose prose-neutral prose-sm max-w-none text-neutral-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }}
          />
        )}

        {content.linkUrl && (
          <div className="mt-5">
            <a
              href={content.linkUrl}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-warning-light to-accent-orange text-white font-semibold text-sm rounded-xl hover:from-warning hover:to-accent-orange transition-all shadow-sm shadow-warning-light/50 group/link"
            >
              <span>{content.linkText || "Explore Story"}</span>
              <ArrowRightIcon className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
