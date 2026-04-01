import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  order: z.number().int().optional(),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const courseReorderSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseReorderInput = z.infer<typeof courseReorderSchema>;
