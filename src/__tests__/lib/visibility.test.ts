import { describe, it, expect } from "vitest";
import {
  getAccessibleVisibilities,
  canAccessVisibility,
  buildVisibilityFilter,
} from "@/lib/visibility";

describe("getAccessibleVisibilities", () => {
  it("TUTOR can access ALL_TUTORS only", () => {
    const vis = getAccessibleVisibilities("TUTOR");
    expect(vis).toContain("ALL_TUTORS");
    expect(vis).not.toContain("LEAD_TUTORS");
    expect(vis).not.toContain("ADMINS_ONLY");
  });

  it("LEAD_TUTOR can access ALL_TUTORS and LEAD_TUTORS", () => {
    const vis = getAccessibleVisibilities("LEAD_TUTOR");
    expect(vis).toContain("ALL_TUTORS");
    expect(vis).toContain("LEAD_TUTORS");
    expect(vis).not.toContain("ADMINS_ONLY");
  });

  it("ADMIN can access all visibilities", () => {
    const vis = getAccessibleVisibilities("ADMIN");
    expect(vis).toContain("ALL_TUTORS");
    expect(vis).toContain("LEAD_TUTORS");
    expect(vis).toContain("FRANCHISEE_OWNERS");
    expect(vis).toContain("ADMINS_ONLY");
  });

  it("SUPER_ADMIN can access all visibilities", () => {
    const vis = getAccessibleVisibilities("SUPER_ADMIN");
    expect(vis).toHaveLength(4);
  });

  it("ONBOARDING_TUTOR cannot access any visibility", () => {
    const vis = getAccessibleVisibilities("ONBOARDING_TUTOR");
    expect(vis).toHaveLength(0);
  });
});

describe("canAccessVisibility", () => {
  it("TUTOR can access ALL_TUTORS", () => {
    expect(canAccessVisibility("TUTOR", "ALL_TUTORS")).toBe(true);
  });

  it("TUTOR cannot access ADMINS_ONLY", () => {
    expect(canAccessVisibility("TUTOR", "ADMINS_ONLY")).toBe(false);
  });

  it("ADMIN can access ADMINS_ONLY", () => {
    expect(canAccessVisibility("ADMIN", "ADMINS_ONLY")).toBe(true);
  });

  it("FRANCHISEE_OWNER can access FRANCHISEE_OWNERS", () => {
    expect(canAccessVisibility("FRANCHISEE_OWNER", "FRANCHISEE_OWNERS")).toBe(true);
  });

  it("FRANCHISEE_OWNER cannot access ADMINS_ONLY", () => {
    expect(canAccessVisibility("FRANCHISEE_OWNER", "ADMINS_ONLY")).toBe(false);
  });
});

describe("buildVisibilityFilter", () => {
  it("admin gets no visibility or org filters", () => {
    const filter = buildVisibilityFilter("ADMIN", null);
    expect(filter.visibility).toBeUndefined();
    expect(filter.OR).toBeUndefined();
    expect(filter.organizationId).toBeUndefined();
  });

  it("tutor gets visibility filter", () => {
    const filter = buildVisibilityFilter("TUTOR", "org-1");
    expect(filter.visibility).toBeDefined();
    expect(filter.visibility!.in).toContain("ALL_TUTORS");
    expect(filter.visibility!.in).not.toContain("ADMINS_ONLY");
  });

  it("tutor with org sees shared and own org resources by default", () => {
    const filter = buildVisibilityFilter("TUTOR", "org-1");
    expect(filter.OR).toBeDefined();
    expect(filter.OR).toHaveLength(2);
    expect(filter.OR![0]).toEqual({ organizationId: null });
    expect(filter.OR![1]).toEqual({ organizationId: "org-1" });
  });

  it("tutor with includeShared=false only sees own org", () => {
    const filter = buildVisibilityFilter("TUTOR", "org-1", false);
    expect(filter.OR).toBeUndefined();
    expect(filter.organizationId).toBe("org-1");
  });

  it("tutor with null orgId sees shared resources", () => {
    const filter = buildVisibilityFilter("TUTOR", null);
    expect(filter.OR).toBeDefined();
    expect(filter.OR![0]).toEqual({ organizationId: null });
    expect(filter.OR![1]).toEqual({ organizationId: null });
  });
});
