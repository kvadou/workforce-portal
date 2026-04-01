"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  PhotoIcon as ImageIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function ImageBlock({ block, isEditing }: ImageBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    src: string;
    alt: string;
    caption: string;
    size: "small" | "medium" | "full";
  };
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setIsUploading(true);
      try {
        // Get presigned URL
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl } = await urlResponse.json();

        // Upload to S3
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Update block with new URL
        updateBlock(block.id, { src: fileUrl });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [block.id, updateBlock]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const sizeClasses = {
    small: "max-w-sm mx-auto",
    medium: "max-w-2xl mx-auto",
    full: "w-full",
  };

  if (isEditing) {
    if (!content.src) {
      // Upload state
      return (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? "border-primary-400 bg-primary-50"
              : "border-neutral-300 hover:border-neutral-400"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
              <p className="text-neutral-500">Uploading...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-600 mb-4">
                Drag and drop an image or click to upload
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <span className="inline-flex items-center justify-center px-4 py-2 border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 rounded-lg text-sm font-semibold">
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Choose Image
                </span>
              </label>
            </>
          )}
        </div>
      );
    }

    // Image uploaded - show with edit options
    return (
      <div className={`${sizeClasses[content.size || "full"]}`}>
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.src}
            alt={content.alt || ""}
            className="w-full rounded-lg"
          />
          <button
            onClick={() => updateBlock(block.id, { src: "" })}
            className="absolute top-2 right-2 h-8 w-8 bg-error text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <input
          type="text"
          value={content.alt || ""}
          onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
          placeholder="Alt text (for accessibility)"
          className="w-full mt-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <input
          type="text"
          value={content.caption || ""}
          onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full mt-2 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
    );
  }

  // View mode
  if (!content.src) return null;

  return (
    <figure className={`${sizeClasses[content.size || "full"]} my-6`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={content.src}
        alt={content.alt || ""}
        className="w-full rounded-lg shadow-sm"
      />
      {content.caption && (
        <figcaption className="text-center text-sm text-neutral-500 mt-2">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}
