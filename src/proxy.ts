import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasMinRole } from "@/lib/roles";

// Domain configuration
const BASE_DOMAIN = process.env.BASE_DOMAIN || "workforceportal.com";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname: string): string {
  const host = hostname.split(":")[0];

  if (IS_DEVELOPMENT) {
    if (host === "localhost" || host === "127.0.0.1") {
      return "hq";
    }
    const parts = host.split(".");
    if (parts.length > 1 && parts[parts.length - 1] === "localhost") {
      return parts[0];
    }
  }

  // Heroku domains should be treated as HQ
  if (host.endsWith(".example.com")) {
    return "hq";
  }

  const baseParts = BASE_DOMAIN.split(".");
  const hostParts = host.split(".");

  if (hostParts.length > baseParts.length) {
    return hostParts[0];
  }

  return "hq";
}

/**
 * Build a redirect URL using the actual request hostname
 */
function buildRedirectUrl(req: NextRequest, path: string): URL {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || req.headers.get("x-forwarded-host") || req.nextUrl.host;
  return new URL(path, `${proto}://${host}`);
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hostname = req.headers.get("host") || req.headers.get("x-forwarded-host") || "";
  const subdomain = extractSubdomain(hostname);

  // Allow auth routes, internal API, webhooks, login, and password setup without NextAuth token
  // Note: /api/internal uses its own Bearer token authentication
  // Note: /api/webhooks use their own signature-based authentication
  const publicPaths = ["/api/auth", "/api/internal", "/api/webhooks", "/login", "/setup-password"];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    response.headers.set("x-organization-subdomain", subdomain);
    return response;
  }

  // Get token using getToken (replaces deprecated withAuth pattern)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Require token for all other routes
  if (!token) {
    // API routes return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Other routes redirect to login
    return NextResponse.redirect(buildRedirectUrl(req, "/login"));
  }

  // Clone the response to add headers
  const response = NextResponse.next();

  // Add organization context headers for downstream use
  response.headers.set("x-organization-subdomain", subdomain);

  // Route protection based on role
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isFranchiseeRoute = pathname.startsWith("/franchise");

  // Admin routes require ADMIN or higher
  if (isAdminRoute) {
    if (!hasMinRole(token.role as string, "ADMIN")) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      return NextResponse.redirect(buildRedirectUrl(req, "/"));
    }
  }

  // Franchisee management routes require FRANCHISEE_OWNER or higher
  if (isFranchiseeRoute) {
    if (!hasMinRole(token.role as string, "FRANCHISEE_OWNER")) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      return NextResponse.redirect(buildRedirectUrl(req, "/"));
    }
  }

  // Onboarding tutors can only access onboarding routes and specific resources
  if (token.role === "ONBOARDING_TUTOR" || token.isOnboarding) {
    const allowedPaths = [
      "/onboarding",
      "/api/auth",
      "/api/onboarding",
      "/profile",
    ];
    const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

    if (!isAllowed) {
      return NextResponse.redirect(buildRedirectUrl(req, "/onboarding"));
    }
  }

  // Check organization access for non-HQ subdomains
  if (subdomain !== "hq") {
    // Users can only access their own org's subdomain unless they're ADMIN+
    const userOrgSubdomain = token.organizationSubdomain as string | undefined;
    const isHighLevelAdmin = hasMinRole(token.role as string, "ADMIN");

    if (!isHighLevelAdmin && userOrgSubdomain && userOrgSubdomain !== subdomain) {
      // Redirect to user's own organization
      const correctUrl = buildOrgUrl(userOrgSubdomain, pathname);
      return NextResponse.redirect(correctUrl);
    }
  }

  return response;
}

/**
 * Build URL for a specific organization
 */
function buildOrgUrl(subdomain: string, path: string = "/"): string {
  if (IS_DEVELOPMENT) {
    if (subdomain === "hq") {
      return `http://localhost:3000${path}`;
    }
    return `http://${subdomain}.localhost:3000${path}`;
  }

  if (subdomain === "hq") {
    return `https://${BASE_DOMAIN}${path}`;
  }
  return `https://${subdomain}.${BASE_DOMAIN}${path}`;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static assets (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon|logo|apple-touch-icon|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
