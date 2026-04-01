import { prisma } from "./prisma";
import { headers } from "next/headers";

// Domain configuration
const BASE_DOMAIN = process.env.BASE_DOMAIN || "workforceportal.com";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Extract subdomain from hostname
 * Examples:
 *   westside.workforceportal.com -> westside
 *   workforceportal.com -> hq
 *   localhost:3000 -> hq (development)
 *   westside.localhost:3000 -> westside (development)
 */
export function extractSubdomain(hostname: string): string {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Development: handle localhost
  if (IS_DEVELOPMENT) {
    if (host === "localhost" || host === "127.0.0.1") {
      return "hq";
    }
    // Support subdomain.localhost for development testing
    const parts = host.split(".");
    if (parts.length > 1 && parts[parts.length - 1] === "localhost") {
      return parts[0];
    }
  }

  // Production: extract from domain
  const baseParts = BASE_DOMAIN.split(".");
  const hostParts = host.split(".");

  // If host has more parts than base domain, first part is subdomain
  if (hostParts.length > baseParts.length) {
    return hostParts[0];
  }

  // No subdomain = HQ
  return "hq";
}

/**
 * Get organization from current request headers
 */
export async function getOrganizationFromRequest() {
  const headersList = await headers();
  const hostname = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const subdomain = extractSubdomain(hostname);

  return getOrganizationBySubdomain(subdomain);
}

/**
 * Get organization by subdomain
 */
export async function getOrganizationBySubdomain(subdomain: string) {
  const organization = await prisma.organization.findUnique({
    where: { subdomain },
    select: {
      id: true,
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
      isHQ: true,
      isActive: true,
      settings: true,
    },
  });

  return organization;
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
      isHQ: true,
      isActive: true,
      settings: true,
    },
  });
}

/**
 * Get all active organizations
 */
export async function getAllOrganizations() {
  return prisma.organization.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
      isHQ: true,
      isActive: true,
    },
    orderBy: [
      { isHQ: "desc" }, // HQ first
      { name: "asc" },
    ],
  });
}

/**
 * Check if user has access to organization
 */
export async function userHasOrgAccess(userId: string, organizationId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      role: true,
    },
  });

  if (!user) return false;

  // Super admins have access to all organizations
  if (user.role === "SUPER_ADMIN") return true;

  // Admins have access to all organizations
  if (user.role === "ADMIN") return true;

  // Other users only have access to their own organization
  return user.organizationId === organizationId;
}

/**
 * Build URL for a specific organization
 */
export function buildOrgUrl(subdomain: string, path: string = "/"): string {
  if (IS_DEVELOPMENT) {
    // In development, use subdomain.localhost:3000
    if (subdomain === "hq") {
      return `http://localhost:3000${path}`;
    }
    return `http://${subdomain}.localhost:3000${path}`;
  }

  // Production
  if (subdomain === "hq") {
    return `https://${BASE_DOMAIN}${path}`;
  }
  return `https://${subdomain}.${BASE_DOMAIN}${path}`;
}

export type OrganizationContext = Awaited<ReturnType<typeof getOrganizationBySubdomain>>;
