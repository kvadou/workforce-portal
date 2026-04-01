import { z } from "zod";

export const mediaCreateSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  originalName: z.string().min(1, "Original name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().int().positive(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().int().positive(),
  folder: z.enum(["images", "videos", "documents", "uploads"]).optional(),
});

export type MediaCreateInput = z.infer<typeof mediaCreateSchema>;
export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
