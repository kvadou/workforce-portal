import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/validations/page";
import { Prisma } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/pages/[id]/duplicate - Duplicate a page
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the source page with content
    const sourcePage = await prisma.page.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });

    if (!sourcePage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Generate a unique slug
    const baseTitle = `${sourcePage.title} (Copy)`;
    let newSlug = generateSlug(baseTitle);
    let counter = 1;

    // Keep trying until we find a unique slug
    while (await prisma.page.findUnique({ where: { slug: newSlug } })) {
      counter++;
      newSlug = generateSlug(`${sourcePage.title} (Copy ${counter})`);
    }

    const newTitle = counter > 1 ? `${sourcePage.title} (Copy ${counter})` : baseTitle;

    // Get max order for this category/parent
    const maxOrder = await prisma.page.aggregate({
      where: {
        pageCategory: sourcePage.pageCategory,
        parentId: sourcePage.parentId,
      },
      _max: { order: true },
    });

    // Create the duplicated page
    const duplicatedPage = await prisma.page.create({
      data: {
        title: newTitle,
        slug: newSlug,
        description: sourcePage.description,
        featuredImage: sourcePage.featuredImage,
        pageCategory: sourcePage.pageCategory,
        organization: sourcePage.organizationId
          ? { connect: { id: sourcePage.organizationId } }
          : undefined,
        visibility: sourcePage.visibility,
        parent: sourcePage.parentId
          ? { connect: { id: sourcePage.parentId } }
          : undefined,
        order: (maxOrder._max.order ?? 0) + 1,
        status: "DRAFT", // Always start as draft
        seoTitle: sourcePage.seoTitle,
        noIndex: sourcePage.noIndex,
        content: sourcePage.content
          ? {
              create: {
                pageType: "page",
                pageId: "", // Will be updated after creation
                blocks: sourcePage.content.blocks as Prisma.InputJsonValue,
                draftBlocks: sourcePage.content.draftBlocks
                  ? (sourcePage.content.draftBlocks as Prisma.InputJsonValue)
                  : Prisma.DbNull,
                hasDraft: sourcePage.content.hasDraft,
              },
            }
          : {
              create: {
                pageType: "page",
                pageId: "",
                blocks: [],
                hasDraft: false,
              },
            },
      },
      include: {
        organization: {
          select: { id: true, name: true, subdomain: true },
        },
        content: true,
        _count: {
          select: { children: true },
        },
      },
    });

    // Update PageContent with the correct pageId
    if (duplicatedPage.contentId) {
      await prisma.pageContent.update({
        where: { id: duplicatedPage.contentId },
        data: { pageId: duplicatedPage.id },
      });
    }

    return NextResponse.json(duplicatedPage, { status: 201 });
  } catch (error) {
    console.error("Error duplicating page:", error);
    return NextResponse.json({ error: "Failed to duplicate page" }, { status: 500 });
  }
}
