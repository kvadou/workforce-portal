import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface SearchResult {
  id: string;
  type: "tutor" | "onboarding" | "course" | "resource" | "page";
  title: string;
  subtitle: string | null;
  href: string;
}

/**
 * GET /api/admin/search?q=term
 * Cross-entity admin search
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const search = `%${q}%`;

    // Run all searches in parallel
    const [tutors, onboarding, courses, resources, pages] = await Promise.all([
      // Tutors — user name or email
      prisma.tutorProfile.findMany({
        where: {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
        take: 5,
      }),

      // Onboarding — user name or email
      prisma.onboardingProgress.findMany({
        where: {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
        take: 5,
      }),

      // Training courses — title
      prisma.trainingCourse.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, isPublished: true },
        take: 5,
      }),

      // Resources — title
      prisma.resource.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, type: true },
        take: 5,
      }),

      // CMS Pages — title
      prisma.page.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        select: { id: true, title: true, status: true },
        take: 5,
      }),
    ]);

    const results: SearchResult[] = [];

    for (const t of tutors) {
      results.push({
        id: t.id,
        type: "tutor",
        title: t.user.name || t.user.email,
        subtitle: t.user.email,
        href: `/admin/tutors/${t.id}`,
      });
    }

    for (const o of onboarding) {
      results.push({
        id: o.id,
        type: "onboarding",
        title: o.user.name || o.user.email,
        subtitle: o.user.email,
        href: `/admin/onboarding/${o.id}`,
      });
    }

    for (const c of courses) {
      results.push({
        id: c.id,
        type: "course",
        title: c.title,
        subtitle: c.isPublished ? "Published" : "Draft",
        href: `/admin/training/${c.id}`,
      });
    }

    for (const r of resources) {
      results.push({
        id: r.id,
        type: "resource",
        title: r.title,
        subtitle: r.type,
        href: `/admin/resources/${r.id}`,
      });
    }

    for (const p of pages) {
      results.push({
        id: p.id,
        type: "page",
        title: p.title,
        subtitle: p.status,
        href: `/admin/pages/${p.id}`,
      });
    }

    // Limit total to 10
    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error("[Admin Search] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
