"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileDownloadBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function FileDownloadBlock({ block, isEditing }: FileDownloadBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    url: string;
    title: string;
    description: string;
    filename: string;
  };
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
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

        // Update block
        updateBlock(block.id, {
          url: fileUrl,
          filename: file.name,
          title: content.title || file.name.replace(/\.[^/.]+$/, ""),
        });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    },
    [block.id, content.title, updateBlock]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        {!content.url ? (
          <div className="text-center py-4">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
                <p className="text-neutral-500">Uploading...</p>
              </div>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="inline-flex items-center justify-center px-4 py-2 border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 rounded-lg text-sm font-semibold">
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Upload File
                  </span>
                </label>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <DocumentIcon className="h-8 w-8 text-primary-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {content.filename}
                </p>
                <label className="mt-1">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="text-xs text-primary-500 hover:underline cursor-pointer">
                    Replace file
                  </span>
                </label>
              </div>
            </div>

            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
              placeholder="Download button text"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />

            <input
              type="text"
              value={content.description || ""}
              onChange={(e) =>
                updateBlock(block.id, { description: e.target.value })
              }
              placeholder="Description (optional)"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </>
        )}
      </div>
    );
  }

  // View mode
  if (!content.url) return null;

  return (
    <a
      href={content.url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group"
    >
      <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
        <ArrowDownTrayIcon className="h-6 w-6 text-primary-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-neutral-900">{content.title || "Download"}</p>
        {content.description && (
          <p className="text-sm text-neutral-500">{content.description}</p>
        )}
      </div>
      <Button variant="outline" size="sm">
        Download
      </Button>
    </a>
  );
}
