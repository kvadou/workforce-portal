import { z } from "zod";

export const pageCategoryEnum = z.enum([
  "TEACHING",
  "BUSINESS",
  "ADMIN",
  "ONBOARDING",
  "CUSTOM",
]);

export const pageStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
  "ARCHIVED",
]);

export const visibilityEnum = z.enum([
  "ALL_TUTORS",
  "LEAD_TUTORS",
  "ADMINS_ONLY",
  "FRANCHISEE_OWNERS",
]);

export const pageCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().nullable(),
  featuredImage: z.string().url().optional().nullable(),
  pageCategory: pageCategoryEnum.optional(),
  organizationId: z.string().optional().nullable(),
  visibility: visibilityEnum.optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().optional(),
  status: pageStatusEnum.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  noIndex: z.boolean().optional(),
});

export const pageUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  slug: z.string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  description: z.string().optional().nullable(),
  featuredImage: z.string().url().optional().nullable(),
  pageCategory: pageCategoryEnum.optional(),
  organizationId: z.string().optional().nullable(),
  visibility: visibilityEnum.optional(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().optional(),
  status: pageStatusEnum.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  noIndex: z.boolean().optional(),
});

export const pageReorderSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

export const pageFilterSchema = z.object({
  pageCategory: pageCategoryEnum.optional(),
  status: pageStatusEnum.optional(),
  visibility: visibilityEnum.optional(),
  organizationId: z.string().optional(),
  parentId: z.string().optional().nullable(),
  includeShared: z.boolean().optional(),
  search: z.string().optional(),
});

export const pagePublishSchema = z.object({
  action: z.enum(["publish", "unpublish", "schedule", "archive"]),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export type PageCategory = z.infer<typeof pageCategoryEnum>;
export type PageStatus = z.infer<typeof pageStatusEnum>;
export type Visibility = z.infer<typeof visibilityEnum>;
export type PageCreateInput = z.infer<typeof pageCreateSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
export type PageReorderInput = z.infer<typeof pageReorderSchema>;
export type PageFilterInput = z.infer<typeof pageFilterSchema>;
export type PagePublishInput = z.infer<typeof pagePublishSchema>;

// Human-readable labels for page categories
export const PAGE_CATEGORY_LABELS: Record<PageCategory, string> = {
  TEACHING: "Teaching",
  BUSINESS: "Business",
  ADMIN: "Admin",
  ONBOARDING: "Onboarding",
  CUSTOM: "Custom",
};

// Human-readable labels for page status
export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  SCHEDULED: "Scheduled",
  ARCHIVED: "Archived",
};

// Human-readable labels for visibility
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  ALL_TUTORS: "All Tutors",
  LEAD_TUTORS: "Lead Tutors+",
  ADMINS_ONLY: "Admins Only",
  FRANCHISEE_OWNERS: "Franchisee Owners+",
};

// Status color mapping for badges
export const PAGE_STATUS_COLORS: Record<PageStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300" },
  PUBLISHED: { bg: "bg-success-light", text: "text-success-dark", border: "border-success" },
  SCHEDULED: { bg: "bg-info-light", text: "text-info-dark", border: "border-info" },
  ARCHIVED: { bg: "bg-warning-light", text: "text-warning-dark", border: "border-warning" },
};

// Helper to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
