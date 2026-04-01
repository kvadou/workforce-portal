"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface PDFEmbedBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function PDFEmbedBlock({ block, isEditing }: PDFEmbedBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    url: string;
    title?: string;
    height?: number;
    showDownload: boolean;
    showFullscreen: boolean;
  };

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const height = content.height || 600;
  const showDownload = content.showDownload !== false;
  const showFullscreen = content.showFullscreen !== false;

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }

      setUploading(true);
      try {
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl } = await urlResponse.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        updateBlock(block.id, {
          url: fileUrl,
          title: content.title || file.name.replace(".pdf", ""),
        });
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [block.id, content.title, updateBlock]
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  if (isEditing) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-primary-500" />
          <span className="font-medium">PDF Embed</span>
        </div>

        {!content.url ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-primary-400 bg-primary-50"
                : "border-neutral-300 hover:border-neutral-400"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
                <p className="text-sm text-neutral-500">Uploading PDF...</p>
              </div>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600 mb-2">
                  Drag and drop a PDF here, or
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                  Choose PDF
                </label>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={content.title || ""}
                  onChange={(e) =>
                    updateBlock(block.id, { title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="PDF Title"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-500 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      height: parseInt(e.target.value) || 600,
                    })
                  }
                  min={200}
                  max={1200}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDownload}
                  onChange={(e) =>
                    updateBlock(block.id, { showDownload: e.target.checked })
                  }
                  className="rounded"
                />
                Show download button
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showFullscreen}
                  onChange={(e) =>
                    updateBlock(block.id, { showFullscreen: e.target.checked })
                  }
                  className="rounded"
                />
                Show fullscreen button
              </label>
            </div>

            {/* URL input for external PDFs */}
            <div>
              <label className="block text-sm text-neutral-500 mb-1">
                PDF URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={content.url}
                  onChange={(e) =>
                    updateBlock(block.id, { url: e.target.value })
                  }
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="https://example.com/document.pdf"
                />
                <button
                  onClick={() => updateBlock(block.id, { url: "" })}
                  className="p-2 text-error hover:bg-error-light rounded-lg"
                  title="Remove PDF"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-500 mb-2">Preview:</p>
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                {content.title && (
                  <div className="flex items-center justify-between p-3 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-error" />
                      <span className="font-medium">{content.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {showDownload && (
                        <span className="text-xs text-neutral-400">
                          Download
                        </span>
                      )}
                      {showFullscreen && (
                        <span className="text-xs text-neutral-400">
                          Fullscreen
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div
                  className="bg-neutral-200"
                  style={{ height: `${Math.min(height, 300)}px` }}
                >
                  <iframe
                    src={`${content.url}#toolbar=0`}
                    className="w-full h-full"
                    title={content.title || "PDF Document"}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // View mode
  if (!content.url) return null;

  return (
    <div className="my-6">
      <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {(content.title || showDownload || showFullscreen) && (
          <div className="flex items-center justify-between p-3 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-error" />
              <span className="font-medium text-neutral-900">
                {content.title || "PDF Document"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showDownload && (
                <a
                  href={content.url}
                  download
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </a>
              )}
              {showFullscreen && (
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Open
                </a>
              )}
            </div>
          </div>
        )}
        <iframe
          src={`${content.url}#toolbar=0&navpanes=0`}
          className="w-full"
          style={{ height: `${height}px` }}
          title={content.title || "PDF Document"}
        />
      </div>
    </div>
  );
}
