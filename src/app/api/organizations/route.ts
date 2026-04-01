import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Validation schema for creating/updating organizations
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain must be lowercase letters, numbers, and hyphens only"),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  isHQ: z.boolean().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

// GET /api/organizations - List all organizations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can list all organizations
    if (!hasMinRole(session.user.role, "ADMIN")) {
      // Non-admins can only see their own organization
      if (!session.user.organizationId) {
        return NextResponse.json({ organizations: [] });
      }

      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          id: true,
          name: true,
          subdomain: true,
          logoUrl: true,
          primaryColor: true,
          isHQ: true,
          isActive: true,
          _count: {
            select: { users: true },
          },
        },
      });

      return NextResponse.json({ organizations: org ? [org] : [] });
    }

    // Admins can see all organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoUrl: true,
        primaryColor: true,
        isHQ: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: [
        { isHQ: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins can create organizations
    if (!hasMinRole(session.user.role, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = organizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if subdomain is already taken
    const existing = await prisma.organization.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Subdomain is already in use" },
        { status: 409 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        isHQ: data.isHQ ?? false,
        isActive: data.isActive ?? true,
        settings: (data.settings ?? {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
