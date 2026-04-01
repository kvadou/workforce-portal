const ROLE_HIERARCHY = [
  "ONBOARDING_TUTOR",
  "TUTOR",
  "LEAD_TUTOR",
  "FRANCHISEE_OWNER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

type AppRole = (typeof ROLE_HIERARCHY)[number];

export function getRoleLevel(role: string): number {
  const index = ROLE_HIERARCHY.indexOf(role as AppRole);
  return index === -1 ? 0 : index;
}

export function hasMinRole(userRole: string, minRole: string): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(minRole);
}

export function canManageRole(managerRole: string, targetRole: string): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

