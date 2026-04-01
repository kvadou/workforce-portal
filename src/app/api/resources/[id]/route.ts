import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resourceUpdateSchema } from "@/lib/validations/resource";
import { Visibility } from "@prisma/client";

// Map visibility to minimum role required
const VISIBILITY_ROLE_MAP: Record<Visibility, string> = {
  ALL_TUTORS: "TUTOR",
  LEAD_TUTORS: "LEAD_TUTOR",
  FRANCHISEE_OWNERS: "FRANCHISEE_OWNER",
  ADMINS_ONLY: "ADMIN",
};

// GET /api/resources/[id] - Get single resource
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Check if user has access to this resource
    const userRole = session.user.role;
    const userOrgId = session.user.organizationId;
    const isAdmin = hasMinRole(userRole, "ADMIN");

    if (!isAdmin) {
      // Check visibility access
      const minRole = VISIBILITY_ROLE_MAP[resource.visibility];
      if (!hasMinRole(userRole, minRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check organization access
      if (resource.organizationId && resource.organizationId !== userOrgId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if resource is active
      if (!resource.isActive) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    );
  }
}

// PUT /api/resources/[id] - Update resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update resources
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = resourceUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.draftContent !== undefined && { draftContent: data.draftContent }),
        ...(data.hasDraft !== undefined && { hasDraft: data.hasDraft }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// PATCH /api/resources/[id] - Partial update (used for draft/publish workflow)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update resources
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = resourceUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.draftContent !== undefined && { draftContent: data.draftContent }),
        ...(data.hasDraft !== undefined && { hasDraft: data.hasDraft }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/[id] - Soft delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete resources
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.resource.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.resource.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
