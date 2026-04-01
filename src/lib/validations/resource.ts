import { z } from "zod";

export const resourceCategoryEnum = z.enum([
  // Teaching Resources
  "VIDEO_LIBRARY",
  "MINI_GAMES",
  "STORY_ILLUSTRATIONS",
  "PRINTABLE_ACTIVITIES",
  "SONGS",
  "CHESS_RESOURCES",
  "BQ_RESOURCES",
  "ONLINE_TEACHING",
  "BEHAVIOR_MANAGEMENT",
  // Business Resources
  "EMAIL_TEMPLATES",
  "FLIER_TEMPLATES",
  "REFERRAL_STRATEGIES",
  "CLIENT_COMMUNICATION",
  "TUTOR_SUPPLIES",
  // Admin Resources
  "ADMIN_TEAM",
  "CLUB_LOCATIONS",
  "FORMS",
  "CHESSPECTATIONS",
  "ADMIN_VIDEO_TUTORIALS",
  "DEIB_POLICIES",
  "LESSON_REPORTS",
  "REFERRAL_GUIDELINES",
]);

export const resourceTypeEnum = z.enum([
  "VIDEO",
  "PDF",
  "IMAGE",
  "LINK",
  "RICH_TEXT",
  "TEMPLATE",
  "CANVA_DESIGN",
]);

export const visibilityEnum = z.enum([
  "ALL_TUTORS",
  "LEAD_TUTORS",
  "ADMINS_ONLY",
  "FRANCHISEE_OWNERS",
]);

export const resourceCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  category: resourceCategoryEnum,
  type: resourceTypeEnum,
  url: z.string().url().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
  draftContent: z.string().optional().nullable(),
  hasDraft: z.boolean().optional(),
  organizationId: z.string().optional().nullable(),
  visibility: visibilityEnum.optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const resourceUpdateSchema = resourceCreateSchema.partial();

export const resourceReorderSchema = z.object({
  resources: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

export const resourceFilterSchema = z.object({
  category: resourceCategoryEnum.optional(),
  type: resourceTypeEnum.optional(),
  visibility: visibilityEnum.optional(),
  organizationId: z.string().optional(),
  isActive: z.boolean().optional(),
  includeShared: z.boolean().optional(),
});

export type ResourceCategory = z.infer<typeof resourceCategoryEnum>;
export type ResourceType = z.infer<typeof resourceTypeEnum>;
export type Visibility = z.infer<typeof visibilityEnum>;
export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
export type ResourceReorderInput = z.infer<typeof resourceReorderSchema>;
export type ResourceFilterInput = z.infer<typeof resourceFilterSchema>;

// Category groupings for UI
export const CATEGORY_GROUPS = {
  teaching: {
    label: "Teaching Resources",
    categories: [
      "VIDEO_LIBRARY",
      "MINI_GAMES",
      "STORY_ILLUSTRATIONS",
      "PRINTABLE_ACTIVITIES",
      "SONGS",
      "CHESS_RESOURCES",
      "BQ_RESOURCES",
      "ONLINE_TEACHING",
      "BEHAVIOR_MANAGEMENT",
    ] as ResourceCategory[],
  },
  business: {
    label: "Business Resources",
    categories: [
      "EMAIL_TEMPLATES",
      "FLIER_TEMPLATES",
      "REFERRAL_STRATEGIES",
      "CLIENT_COMMUNICATION",
      "TUTOR_SUPPLIES",
    ] as ResourceCategory[],
  },
  admin: {
    label: "Admin Resources",
    categories: [
      "ADMIN_TEAM",
      "CLUB_LOCATIONS",
      "FORMS",
      "CHESSPECTATIONS",
      "ADMIN_VIDEO_TUTORIALS",
      "DEIB_POLICIES",
      "LESSON_REPORTS",
      "REFERRAL_GUIDELINES",
    ] as ResourceCategory[],
  },
} as const;

// Human-readable labels for categories
export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  VIDEO_LIBRARY: "Video Library",
  MINI_GAMES: "Mini Games",
  STORY_ILLUSTRATIONS: "Story Illustrations",
  PRINTABLE_ACTIVITIES: "Printable Activities",
  SONGS: "Songs",
  CHESS_RESOURCES: "Chess Resources",
  BQ_RESOURCES: "BQ Resources",
  ONLINE_TEACHING: "Online Teaching",
  BEHAVIOR_MANAGEMENT: "Behavior Management",
  EMAIL_TEMPLATES: "Email Templates",
  FLIER_TEMPLATES: "Flier Templates",
  REFERRAL_STRATEGIES: "Referral Strategies",
  CLIENT_COMMUNICATION: "Client Communication",
  TUTOR_SUPPLIES: "Tutor Supplies",
  ADMIN_TEAM: "Admin Team",
  CLUB_LOCATIONS: "Club Locations",
  FORMS: "Forms",
  CHESSPECTATIONS: "Chesspectations",
  ADMIN_VIDEO_TUTORIALS: "Admin Video Tutorials",
  DEIB_POLICIES: "DEIB Policies",
  LESSON_REPORTS: "Lesson Reports",
  REFERRAL_GUIDELINES: "Referral Guidelines",
};

// Human-readable labels for types
export const TYPE_LABELS: Record<ResourceType, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  IMAGE: "Image",
  LINK: "Link",
  RICH_TEXT: "Rich Text",
  TEMPLATE: "Template",
  CANVA_DESIGN: "Canva Design",
};

// Human-readable labels for visibility
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  ALL_TUTORS: "All Tutors",
  LEAD_TUTORS: "Lead Tutors+",
  ADMINS_ONLY: "Admins Only",
  FRANCHISEE_OWNERS: "Franchisee Owners+",
};
