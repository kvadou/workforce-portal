import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Validation schema for updating organizations
const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/, "Subdomain must be lowercase letters, numbers, and hyphens only").optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  isHQ: z.boolean().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

// GET /api/organizations/[id] - Get single organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can view their own organization or admins can view any
    const canView =
      hasMinRole(session.user.role, "ADMIN") ||
      session.user.organizationId === id;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            resources: true,
            announcements: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins can update organizations fully
    // Franchisee owners can update limited fields of their own org
    const isSuperAdmin = hasMinRole(session.user.role, "SUPER_ADMIN");
    const isFranchiseeOwner =
      session.user.role === "FRANCHISEE_OWNER" &&
      session.user.organizationId === id;

    if (!isSuperAdmin && !isFranchiseeOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Franchisee owners can only update specific fields
    if (isFranchiseeOwner && !isSuperAdmin) {
      const allowedFields = ["logoUrl", "primaryColor", "settings"];
      const attemptedFields = Object.keys(data);
      const disallowedFields = attemptedFields.filter(
        (f) => !allowedFields.includes(f)
      );

      if (disallowedFields.length > 0) {
        return NextResponse.json(
          { error: `Cannot update fields: ${disallowedFields.join(", ")}` },
          { status: 403 }
        );
      }
    }

    // Check if new subdomain is already taken (if changing)
    if (data.subdomain) {
      const existing = await prisma.organization.findFirst({
        where: {
          subdomain: data.subdomain,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Subdomain is already in use" },
          { status: 409 }
        );
      }
    }

    // Handle settings field specially for Prisma JSON null
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subdomain !== undefined && { subdomain: data.subdomain }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.isHQ !== undefined && { isHQ: data.isHQ }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.settings !== undefined && {
          settings: data.settings === null
            ? Prisma.JsonNull
            : (data.settings as Prisma.InputJsonValue),
        }),
      },
    });

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins can delete organizations
    if (!hasMinRole(session.user.role, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of HQ
    if (organization.isHQ) {
      return NextResponse.json(
        { error: "Cannot delete HQ organization" },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive if there are users
    if (organization._count.users > 0) {
      await prisma.organization.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Organization deactivated (has users)",
        deactivated: true,
      });
    }

    // Hard delete if no users
    await prisma.organization.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Organization deleted" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
