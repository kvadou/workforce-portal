import { z } from "zod";

export const curriculumCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().optional().nullable(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  order: z.number().int().optional(),
});

export const curriculumUpdateSchema = curriculumCreateSchema.partial();

export const curriculumReorderSchema = z.object({
  curricula: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

export type CurriculumCreateInput = z.infer<typeof curriculumCreateSchema>;
export type CurriculumUpdateInput = z.infer<typeof curriculumUpdateSchema>;
export type CurriculumReorderInput = z.infer<typeof curriculumReorderSchema>;

// Re-export course schemas for backward compatibility
export {
  curriculumCreateSchema as courseCreateSchema,
  curriculumUpdateSchema as courseUpdateSchema,
  curriculumReorderSchema as courseReorderSchema,
};
export type { CurriculumCreateInput as CourseCreateInput };
export type { CurriculumUpdateInput as CourseUpdateInput };
export type { CurriculumReorderInput as CourseReorderInput };
