"use client";

import { useState, useCallback } from "react";
import { CMSBlock, useCMS } from "@/providers/CMSProvider";
import {
  PhotoIcon as ImageIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
}

interface GalleryBlockProps {
  block: CMSBlock;
  isEditing: boolean;
}

export function GalleryBlock({ block, isEditing }: GalleryBlockProps) {
  const { updateBlock } = useCMS();
  const content = block.content as {
    images: GalleryImage[];
    columns: 2 | 3 | 4;
  };
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = content.images || [];
  const columns = content.columns || 3;

  const handleUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      const newImages: GalleryImage[] = [];

      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;

          const urlResponse = await fetch(
            `/api/media/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
          );
          if (!urlResponse.ok) continue;
          const { uploadUrl, fileUrl } = await urlResponse.json();

          await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          newImages.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            src: fileUrl,
            alt: file.name,
          });
        }

        updateBlock(block.id, { images: [...images, ...newImages] });
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [block.id, images, updateBlock]
  );

  const removeImage = (imageId: string) => {
    updateBlock(block.id, {
      images: images.filter((img) => img.id !== imageId),
    });
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Column selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Columns:</span>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => updateBlock(block.id, { columns: n })}
              className={`px-3 py-1 text-sm rounded ${
                columns === n
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Image grid */}
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {images.map((image) => (
            <div key={image.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-2 right-2 h-6 w-6 bg-error text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Add more button */}
          <label className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            {isUploading ? (
              <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin" />
            ) : (
              <>
                <PlusIcon className="h-8 w-8 text-neutral-400" />
                <span className="text-sm text-neutral-500 mt-1">Add Images</span>
              </>
            )}
          </label>
        </div>
      </div>
    );
  }

  // View mode
  if (images.length === 0) return null;

  return (
    <div className={`grid ${gridCols[columns]} gap-4 my-6`}>
      {images.map((image) => (
        <div
          key={image.id}
          className="aspect-square cursor-pointer"
          onClick={() => setSelectedImage(image.src)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-card-hover transition-shadow"
          />
        </div>
      ))}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300"
            onClick={() => setSelectedImage(null)}
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
