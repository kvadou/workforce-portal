import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pageUpdateSchema } from "@/lib/validations/page";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/pages/[id] - Get a single page with content
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, subdomain: true },
        },
        content: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 10,
              select: {
                id: true,
                versionNumber: true,
                createdBy: true,
                createdAt: true,
                note: true,
              },
            },
          },
        },
        parent: {
          select: { id: true, title: true, slug: true },
        },
        children: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, slug: true, status: true, order: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

// PUT /api/pages/[id] - Update a page
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = pageUpdateSchema.parse(body);

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If slug is being changed, check for conflicts
    if (validatedData.slug && validatedData.slug !== existingPage.slug) {
      const slugConflict = await prisma.page.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Parameters<typeof prisma.page.update>[0]["data"] = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.featuredImage !== undefined) updateData.featuredImage = validatedData.featuredImage;
    if (validatedData.pageCategory !== undefined) updateData.pageCategory = validatedData.pageCategory;
    if (validatedData.organizationId !== undefined) updateData.organizationId = validatedData.organizationId;
    if (validatedData.visibility !== undefined) updateData.visibility = validatedData.visibility;
    if (validatedData.parentId !== undefined) updateData.parentId = validatedData.parentId;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.scheduledAt !== undefined) {
      updateData.scheduledAt = validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null;
    }
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null;
    }
    if (validatedData.seoTitle !== undefined) updateData.seoTitle = validatedData.seoTitle;
    if (validatedData.noIndex !== undefined) updateData.noIndex = validatedData.noIndex;

    // Update publishedAt when status changes to PUBLISHED
    if (validatedData.status === "PUBLISHED" && existingPage.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const page = await prisma.page.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: { id: true, name: true, subdomain: true },
        },
        content: {
          select: { id: true, hasDraft: true, publishedAt: true },
        },
        _count: {
          select: { children: true },
        },
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating page:", error);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

// DELETE /api/pages/[id] - Archive a page (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true } },
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Prevent deleting pages with children
    if (existingPage._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete page with child pages. Delete or move children first." },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Hard delete - remove the page and its content completely
      await prisma.$transaction(async (tx) => {
        // Delete PageContent first (if exists)
        if (existingPage.contentId) {
          // Delete versions
          await tx.pageVersion.deleteMany({
            where: { pageContentId: existingPage.contentId },
          });
          // Delete content (this will also disconnect from page)
        }

        // Delete the page (cascade will handle content)
        await tx.page.delete({
          where: { id },
        });
      });

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Soft delete - just archive the page
      const page = await prisma.page.update({
        where: { id },
        data: { status: "ARCHIVED" },
        include: {
          organization: {
            select: { id: true, name: true, subdomain: true },
          },
          content: {
            select: { id: true, hasDraft: true },
          },
        },
      });

      return NextResponse.json(page);
    }
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
