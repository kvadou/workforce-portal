"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  PhotoIcon as ImageIcon,
  DocumentIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  CheckIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  type: "image" | "video" | "document" | "other";
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item: MediaItem) => void;
  allowedTypes?: ("image" | "video" | "document" | "other")[];
  multiple?: boolean;
}

export function MediaLibrary({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ["image", "video", "document", "other"],
  multiple = false,
}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  // Fetch media items
  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const newItems: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        // Get upload URL
        const urlResponse = await fetch(
          `/api/media/upload-url?filename=${encodeURIComponent(
            file.name
          )}&contentType=${encodeURIComponent(file.type)}`
        );
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, fileUrl, filename } = await urlResponse.json();

        // Upload file to S3
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Determine file type
        let type: MediaItem["type"] = "other";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (
          file.type === "application/pdf" ||
          file.type.includes("document") ||
          file.type.includes("text")
        )
          type = "document";

        // Save to database
        const saveResponse = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filename || file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: fileUrl,
            thumbnailUrl: type === "image" ? fileUrl : null,
          }),
        });

        let mediaId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (saveResponse.ok) {
          const savedMedia = await saveResponse.json();
          mediaId = savedMedia.id;
        }

        const newItem: MediaItem = {
          id: mediaId,
          url: fileUrl,
          filename: file.name,
          type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          thumbnail: type === "image" ? fileUrl : undefined,
        };

        newItems.push(newItem);
      }

      setItems((prev) => [...newItems, ...prev]);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [handleUpload]
  );

  const handleSelect = (item: MediaItem) => {
    if (!allowedTypes.includes(item.type)) return;

    if (multiple) {
      setSelectedItems((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      onSelect(item.url, item);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    const selectedMediaItems = items.filter((item) =>
      selectedItems.includes(item.id)
    );
    for (const item of selectedMediaItems) {
      onSelect(item.url, item);
    }
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/media/${deleteTarget.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesAllowed = allowedTypes.includes(item.type);
    return matchesSearch && matchesType && matchesAllowed;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTypeIcon = (type: MediaItem["type"]) => {
    switch (type) {
      case "image":
        return ImageIcon;
      case "video":
        return PlayCircleIcon;
      case "document":
        return DocumentTextIcon;
      default:
        return DocumentIcon;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-10 bg-white rounded-xl shadow-modal z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Media Library
          </h2>
          <IconButton
            icon={XMarkIcon}
            size="sm"
            aria-label="Close media library"
            onClick={onClose}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-neutral-200 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="all">All Types</option>
            {allowedTypes.includes("image") && <option value="image">Images</option>}
            {allowedTypes.includes("video") && <option value="video">Videos</option>}
            {allowedTypes.includes("document") && (
              <option value="document">Documents</option>
            )}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${
                viewMode === "grid"
                  ? "bg-white shadow-sm"
                  : "hover:bg-neutral-200"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${
                viewMode === "list"
                  ? "bg-white shadow-sm"
                  : "hover:bg-neutral-200"
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Upload button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleUpload(e.target.files);
              }}
            />
            {uploading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpTrayIcon className="h-4 w-4" />
            )}
            Upload
          </label>
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-auto p-4 ${
            dragOver ? "bg-primary-50" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <ArrowUpTrayIcon className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No media files</p>
              <p className="text-sm">
                Drag and drop files here, or click Upload
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems.map((item) => {
                const Icon = getTypeIcon(item.type);
                const isSelected = selectedItems.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-neutral-100">
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-12 w-12 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-6 w-6 bg-primary-500 rounded-lg flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, "_blank");
                        }}
                        className="p-2 bg-white rounded-full hover:bg-neutral-100"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-error-light text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Filename */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-neutral-700 truncate">
                        {item.filename}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = getTypeIcon(item.type);
                const isSelected = selectedItems.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary-50 border-2 border-primary-500"
                        : "bg-neutral-50 border-2 border-transparent hover:bg-neutral-100"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 bg-neutral-200 rounded overflow-hidden flex-shrink-0">
                      {item.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {item.filename}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatFileSize(item.size)} •{" "}
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="h-6 w-6 bg-primary-500 rounded-lg flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.url, "_blank");
                        }}
                        className="p-2 hover:bg-neutral-200 rounded"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-neutral-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="p-2 hover:bg-error-light rounded text-error"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer (for multiple selection) */}
        {multiple && selectedItems.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-neutral-50">
            <p className="text-sm text-neutral-600">
              {selectedItems.length} file{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
              <Button onClick={handleConfirmSelection}>
                Insert Selected
              </Button>
            </div>
          </div>
        )}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        message={`Delete "${deleteTarget?.filename}"?`}
        variant="danger"
        confirmLabel="Delete"
      />
      </div>
    </>
  );
}

// Hook to manage media library state
export function useMediaLibrary() {
  const [isOpen, setIsOpen] = useState(false);
  const [onSelectCallback, setOnSelectCallback] = useState<
    ((url: string, item: MediaItem) => void) | null
  >(null);
  const [allowedTypes, setAllowedTypes] = useState<
    ("image" | "video" | "document" | "other")[]
  >(["image", "video", "document", "other"]);

  const openMediaLibrary = (
    callback: (url: string, item: MediaItem) => void,
    types: ("image" | "video" | "document" | "other")[] = [
      "image",
      "video",
      "document",
      "other",
    ]
  ) => {
    setOnSelectCallback(() => callback);
    setAllowedTypes(types);
    setIsOpen(true);
  };

  const closeMediaLibrary = () => {
    setIsOpen(false);
    setOnSelectCallback(null);
  };

  const handleSelect = (url: string, item: MediaItem) => {
    if (onSelectCallback) {
      onSelectCallback(url, item);
    }
  };

  return {
    isOpen,
    openMediaLibrary,
    closeMediaLibrary,
    handleSelect,
    allowedTypes,
  };
}
