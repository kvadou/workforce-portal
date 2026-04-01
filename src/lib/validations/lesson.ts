import { z } from "zod";

export const lessonCreateSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  number: z.number().int().positive(),
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  order: z.number().int().optional(),
});

export const lessonUpdateSchema = lessonCreateSchema.omit({ moduleId: true }).partial();

export const lessonReorderSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

// Story content validation
export const storyContentSchema = z.object({
  introduction: z.string().optional().nullable(),
  teacherTip: z.string().optional().nullable(),
  content: z.any(), // JSON rich text content
});

// Chessercises validation
export const chessercisesSchema = z.object({
  warmUp: z.string().optional().nullable(),
  dressUp: z.string().optional().nullable(),
  chessUp: z.string().optional().nullable(),
});

// Exercise validation
export const exerciseCreateSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1, "Title is required"),
  instructions: z.string().min(1, "Instructions are required"),
  boardSetup: z.any(), // JSON board setup
  solution: z.string().min(1, "Solution is required"),
  order: z.number().int().optional(),
});

export const exerciseUpdateSchema = exerciseCreateSchema.partial();

// Print material validation
export const printMaterialCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["EXERCISE_PAGE", "COLORING_PAGE"]),
  pageCount: z.number().int().positive().optional(),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  order: z.number().int().optional(),
});

export const printMaterialUpdateSchema = printMaterialCreateSchema.partial();

// Developmental skill validation
export const developmentalSkillSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  order: z.number().int().optional(),
});

export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;
export type LessonUpdateInput = z.infer<typeof lessonUpdateSchema>;
export type LessonReorderInput = z.infer<typeof lessonReorderSchema>;
export type StoryContentInput = z.infer<typeof storyContentSchema>;
export type ChessercisesInput = z.infer<typeof chessercisesSchema>;
export type ExerciseCreateInput = z.infer<typeof exerciseCreateSchema>;
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>;
export type PrintMaterialCreateInput = z.infer<typeof printMaterialCreateSchema>;
export type PrintMaterialUpdateInput = z.infer<typeof printMaterialUpdateSchema>;
export type DevelopmentalSkillInput = z.infer<typeof developmentalSkillSchema>;
