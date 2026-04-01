import { describe, it, expect } from "vitest";
import { getRoleLevel, hasMinRole, canManageRole } from "@/lib/auth";

const ROLES_ORDERED = [
  "ONBOARDING_TUTOR",
  "TUTOR",
  "LEAD_TUTOR",
  "FRANCHISEE_OWNER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

describe("getRoleLevel", () => {
  it("returns ascending levels for role hierarchy", () => {
    for (let i = 0; i < ROLES_ORDERED.length - 1; i++) {
      expect(getRoleLevel(ROLES_ORDERED[i])).toBeLessThan(
        getRoleLevel(ROLES_ORDERED[i + 1])
      );
    }
  });

  it("returns 0 for ONBOARDING_TUTOR (lowest)", () => {
    expect(getRoleLevel("ONBOARDING_TUTOR")).toBe(0);
  });

  it("returns 5 for SUPER_ADMIN (highest)", () => {
    expect(getRoleLevel("SUPER_ADMIN")).toBe(5);
  });

  it("returns 0 for unknown role", () => {
    expect(getRoleLevel("NONEXISTENT_ROLE")).toBe(0);
  });
});

describe("hasMinRole", () => {
  it("SUPER_ADMIN has all roles", () => {
    for (const role of ROLES_ORDERED) {
      expect(hasMinRole("SUPER_ADMIN", role)).toBe(true);
    }
  });

  it("ONBOARDING_TUTOR only has ONBOARDING_TUTOR", () => {
    expect(hasMinRole("ONBOARDING_TUTOR", "ONBOARDING_TUTOR")).toBe(true);
    expect(hasMinRole("ONBOARDING_TUTOR", "TUTOR")).toBe(false);
    expect(hasMinRole("ONBOARDING_TUTOR", "ADMIN")).toBe(false);
  });

  it("TUTOR has TUTOR and ONBOARDING_TUTOR but not ADMIN", () => {
    expect(hasMinRole("TUTOR", "ONBOARDING_TUTOR")).toBe(true);
    expect(hasMinRole("TUTOR", "TUTOR")).toBe(true);
    expect(hasMinRole("TUTOR", "LEAD_TUTOR")).toBe(false);
    expect(hasMinRole("TUTOR", "ADMIN")).toBe(false);
  });

  it("ADMIN has everything below and at ADMIN but not SUPER_ADMIN", () => {
    expect(hasMinRole("ADMIN", "TUTOR")).toBe(true);
    expect(hasMinRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasMinRole("ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("same role returns true (boundary)", () => {
    for (const role of ROLES_ORDERED) {
      expect(hasMinRole(role, role)).toBe(true);
    }
  });
});

describe("canManageRole", () => {
  it("SUPER_ADMIN can manage all other roles", () => {
    for (const role of ROLES_ORDERED.slice(0, -1)) {
      expect(canManageRole("SUPER_ADMIN", role)).toBe(true);
    }
  });

  it("SUPER_ADMIN cannot manage another SUPER_ADMIN", () => {
    expect(canManageRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("ADMIN can manage roles below ADMIN", () => {
    expect(canManageRole("ADMIN", "TUTOR")).toBe(true);
    expect(canManageRole("ADMIN", "LEAD_TUTOR")).toBe(true);
    expect(canManageRole("ADMIN", "FRANCHISEE_OWNER")).toBe(true);
  });

  it("ADMIN cannot manage ADMIN or SUPER_ADMIN", () => {
    expect(canManageRole("ADMIN", "ADMIN")).toBe(false);
    expect(canManageRole("ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("TUTOR can only manage ONBOARDING_TUTOR", () => {
    expect(canManageRole("TUTOR", "ONBOARDING_TUTOR")).toBe(true);
    expect(canManageRole("TUTOR", "TUTOR")).toBe(false);
    expect(canManageRole("TUTOR", "LEAD_TUTOR")).toBe(false);
    expect(canManageRole("TUTOR", "ADMIN")).toBe(false);
    expect(canManageRole("TUTOR", "SUPER_ADMIN")).toBe(false);
  });

  it("no role can manage itself", () => {
    for (const role of ROLES_ORDERED) {
      expect(canManageRole(role, role)).toBe(false);
    }
  });
});
