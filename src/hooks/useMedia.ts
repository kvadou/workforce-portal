import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Media, User } from "@prisma/client";
import { MediaCreateInput, PresignedUrlRequest } from "@/lib/validations/media";

type MediaWithUser = Media & {
  uploadedBy?: Pick<User, "name" | "email">;
};

type MediaListResponse = {
  media: MediaWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PresignedUrlResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  filename: string;
};

// Fetch media list
async function fetchMedia(params?: {
  mimeType?: string;
  page?: number;
  limit?: number;
}): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.mimeType) searchParams.set("mimeType", params.mimeType);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const response = await fetch(`/api/media?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch media");
  return response.json();
}

// Get presigned upload URL
async function getPresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  const response = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get upload URL");
  }
  return response.json();
}

// Upload file to S3 using presigned URL
async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  if (!response.ok) throw new Error("Failed to upload file");
}

// Create media record in database
async function createMedia(data: MediaCreateInput): Promise<Media> {
  const response = await fetch("/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create media record");
  return response.json();
}

// Delete media
async function deleteMedia(id: string): Promise<void> {
  const response = await fetch(`/api/media/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete media");
}

// Full upload function (get URL, upload to S3, create record)
async function uploadMedia(
  file: File,
  folder: "images" | "videos" | "documents" | "uploads" = "uploads"
): Promise<Media> {
  // 1. Get presigned URL
  const { uploadUrl, publicUrl, filename } = await getPresignedUrl({
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    folder,
  });

  // 2. Upload to S3
  await uploadToS3(uploadUrl, file);

  // 3. Create database record
  const media = await createMedia({
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url: publicUrl,
    thumbnailUrl: null,
  });

  return media;
}

// Hooks
export function useMedia(params?: { mimeType?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["media", params],
    queryFn: () => fetchMedia(params),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      folder,
    }: {
      file: File;
      folder?: "images" | "videos" | "documents" | "uploads";
    }) => uploadMedia(file, folder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

// Helper to determine folder from MIME type
export function getFolderFromMimeType(
  mimeType: string
): "images" | "videos" | "documents" | "uploads" {
  if (mimeType.startsWith("image/")) return "images";
  if (mimeType.startsWith("video/")) return "videos";
  if (mimeType === "application/pdf") return "documents";
  return "uploads";
}
