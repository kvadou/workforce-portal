"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  CameraIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useUploadAvatar } from "@/hooks/useProfile";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName,
  onUploadComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      uploadAvatar(file, {
        onSuccess: (url) => {
          setPreview(null);
          onUploadComplete?.(url);
        },
        onError: (err) => {
          setPreview(null);
          setError(err instanceof Error ? err.message : "Failed to upload avatar");
        },
      });
    },
    [uploadAvatar, onUploadComplete]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayUrl = preview || currentAvatarUrl;
  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Preview */}
      <div className="relative group">
        <div className="h-28 w-28 rounded-full bg-neutral-100 overflow-hidden ring-4 ring-white shadow-sm">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={userName || "Profile"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
              {initials ? (
                <span className="text-2xl font-bold text-white">{initials}</span>
              ) : (
                <CameraIcon className="h-10 w-10 text-white/70" />
              )}
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {/* Hover Overlay */}
          {!isUploading && (
            <button
              onClick={handleClick}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                <CameraIcon className="h-6 w-6 text-white" />
                <span className="text-xs text-white mt-1">Change</span>
              </div>
            </button>
          )}
        </div>

        {/* Cancel Preview Button */}
        {preview && !isUploading && (
          <button
            onClick={clearPreview}
            className="absolute -top-1 -right-1 h-6 w-6 bg-error rounded-full flex items-center justify-center shadow-sm hover:bg-error transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload Photo"}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-error text-center">{error}</p>
      )}

      {/* Helper Text */}
      <p className="mt-2 text-xs text-neutral-500 text-center max-w-[200px]">
        Square image recommended. Max 10MB.
      </p>
    </div>
  );
}
