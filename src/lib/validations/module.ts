import { z } from "zod";

export const moduleCreateSchema = z.object({
  curriculumId: z.string().min(1, "Curriculum ID is required").optional(),
  courseId: z.string().min(1, "Course ID is required").optional(), // Backward compatible
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  order: z.number().int().optional(),
}).refine(
  (data) => data.curriculumId || data.courseId,
  { message: "Either curriculumId or courseId is required" }
);

export const moduleUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  order: z.number().int().optional(),
}).partial();

export const moduleReorderSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>;
export type ModuleReorderInput = z.infer<typeof moduleReorderSchema>;
