import { z } from "zod";

export const announcementTypeEnum = z.enum([
  "IMPORTANT_DATE",
  "ANNOUNCEMENT",
  "STORY_SPOTLIGHT",
  "TUTOR_REVIEW",
]);

export const userRoleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "FRANCHISEE_OWNER",
  "LEAD_TUTOR",
  "TUTOR",
  "ONBOARDING_TUTOR",
]);

export const announcementCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  type: announcementTypeEnum,
  imageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
  linkText: z.string().max(100).optional().nullable(),
  organizationId: z.string().optional().nullable(),
  targetRoles: z.array(userRoleEnum).min(1, "At least one target role is required"),
  isPinned: z.boolean().optional(),
  publishDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial();

export const announcementFilterSchema = z.object({
  type: announcementTypeEnum.optional(),
  organizationId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
  includeExpired: z.boolean().optional(),
  includeShared: z.boolean().optional(),
});

export type AnnouncementType = z.infer<typeof announcementTypeEnum>;
export type UserRole = z.infer<typeof userRoleEnum>;
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;
export type AnnouncementFilterInput = z.infer<typeof announcementFilterSchema>;

// Human-readable labels for announcement types
export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  IMPORTANT_DATE: "Important Date",
  ANNOUNCEMENT: "Announcement",
  STORY_SPOTLIGHT: "Story Spotlight",
  TUTOR_REVIEW: "Tutor Review",
};

// Human-readable labels for user roles
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FRANCHISEE_OWNER: "Franchisee Owner",
  LEAD_TUTOR: "Lead Tutor",
  TUTOR: "Tutor",
  ONBOARDING_TUTOR: "Onboarding Tutor",
};

// Type colors for badges
export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, { bg: string; text: string }> = {
  IMPORTANT_DATE: { bg: "bg-error-light", text: "text-error" },
  ANNOUNCEMENT: { bg: "bg-primary-100", text: "text-primary-700" },
  STORY_SPOTLIGHT: { bg: "bg-warning-light", text: "text-accent-orange" },
  TUTOR_REVIEW: { bg: "bg-success-light", text: "text-success" },
};
