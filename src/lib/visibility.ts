import { Visibility, UserRole } from "@prisma/client";
import { hasMinRole } from "./auth";

// Map visibility to minimum role required
export const VISIBILITY_ROLE_MAP: Record<Visibility, string> = {
  ALL_TUTORS: "TUTOR",
  LEAD_TUTORS: "LEAD_TUTOR",
  FRANCHISEE_OWNERS: "FRANCHISEE_OWNER",
  ADMINS_ONLY: "ADMIN",
};

/**
 * Get the list of visibility levels a user has access to based on their role
 */
export function getAccessibleVisibilities(userRole: string): Visibility[] {
  const accessibleVisibilities: Visibility[] = [];

  for (const [vis, minRole] of Object.entries(VISIBILITY_ROLE_MAP)) {
    if (hasMinRole(userRole, minRole)) {
      accessibleVisibilities.push(vis as Visibility);
    }
  }

  return accessibleVisibilities;
}

/**
 * Check if a user has access to a specific visibility level
 */
export function canAccessVisibility(userRole: string, visibility: Visibility): boolean {
  const minRole = VISIBILITY_ROLE_MAP[visibility];
  return hasMinRole(userRole, minRole);
}

/**
 * Build a Prisma where clause for visibility filtering
 */
export function buildVisibilityFilter(
  userRole: string,
  userOrgId: string | null | undefined,
  includeShared: boolean = true
): {
  visibility?: { in: Visibility[] };
  OR?: Array<{ organizationId: string | null }>;
  organizationId?: string | null;
} {
  const isAdmin = hasMinRole(userRole, "ADMIN");
  const filter: {
    visibility?: { in: Visibility[] };
    OR?: Array<{ organizationId: string | null }>;
    organizationId?: string | null;
  } = {};

  // Visibility filter based on role (non-admins only see what they have access to)
  if (!isAdmin) {
    filter.visibility = { in: getAccessibleVisibilities(userRole) };
  }

  // Organization filter (non-admins see shared + their org)
  if (!isAdmin) {
    if (includeShared) {
      filter.OR = [
        { organizationId: null }, // Shared resources
        { organizationId: userOrgId ?? null }, // User's org resources
      ];
    } else if (userOrgId) {
      filter.organizationId = userOrgId;
    }
  }

  return filter;
}
