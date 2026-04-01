import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET - Fetch page content (published or draft depending on user role)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string; pageId: string }> }
) {
  try {
    const { pageType, pageId } = await params;
    const session = await getServerSession(authOptions);

    const isAdmin =
      session?.user?.role === "SUPER_ADMIN" ||
      session?.user?.role === "ADMIN";

    // Find page content
    const pageContent = await prisma.pageContent.findUnique({
      where: {
        pageType_pageId: {
          pageType,
          pageId,
        },
      },
    });

    if (!pageContent) {
      // Return empty blocks if no content exists
      return NextResponse.json({
        blocks: [],
        hasDraft: false,
        isNew: true,
      });
    }

    // Admins see draft if it exists, otherwise published
    // Non-admins only see published
    let blocks = pageContent.blocks || [];
    if (isAdmin && pageContent.hasDraft && pageContent.draftBlocks) {
      blocks = pageContent.draftBlocks;
    }

    return NextResponse.json({
      id: pageContent.id,
      blocks,
      hasDraft: pageContent.hasDraft,
      publishedAt: pageContent.publishedAt,
      isNew: false,
    });
  } catch (error) {
    console.error("Error fetching page content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// PUT - Save page content (draft or publish)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string; pageId: string }> }
) {
  try {
    const { pageType, pageId } = await params;
    const session = await getServerSession(authOptions);

    // Must be admin to edit
    const isAdmin =
      session?.user?.role === "SUPER_ADMIN" ||
      session?.user?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { blocks, action } = body; // action: "draft" | "publish" | "discard"

    if (!blocks && action !== "discard") {
      return NextResponse.json(
        { error: "Blocks are required" },
        { status: 400 }
      );
    }

    const existingContent = await prisma.pageContent.findUnique({
      where: {
        pageType_pageId: {
          pageType,
          pageId,
        },
      },
    });

    if (action === "discard") {
      // Discard draft changes
      if (existingContent) {
        const updated = await prisma.pageContent.update({
          where: { id: existingContent.id },
          data: {
            draftBlocks: Prisma.DbNull,
            hasDraft: false,
          },
        });
        return NextResponse.json({
          success: true,
          blocks: updated.blocks,
          hasDraft: false,
        });
      }
      return NextResponse.json({ success: true, blocks: [], hasDraft: false });
    }

    if (action === "publish") {
      // Publish: save blocks as published, clear draft
      const publishData = {
        blocks,
        draftBlocks: Prisma.DbNull,
        hasDraft: false,
        publishedAt: new Date(),
        publishedBy: session?.user?.id,
      };

      let pageContent;
      if (existingContent) {
        // Create a version before publishing
        const versionCount = await prisma.pageVersion.count({
          where: { pageContentId: existingContent.id },
        });

        await prisma.pageVersion.create({
          data: {
            pageContentId: existingContent.id,
            blocks: existingContent.blocks || [],
            versionNumber: versionCount + 1,
            createdBy: session?.user?.id || "unknown",
            note: "Auto-saved before publish",
          },
        });

        pageContent = await prisma.pageContent.update({
          where: { id: existingContent.id },
          data: publishData,
        });
      } else {
        pageContent = await prisma.pageContent.create({
          data: {
            pageType,
            pageId,
            ...publishData,
          },
        });
      }

      return NextResponse.json({
        success: true,
        id: pageContent.id,
        blocks: pageContent.blocks,
        hasDraft: false,
        publishedAt: pageContent.publishedAt,
      });
    }

    // Default: save as draft
    const data = {
      pageType,
      pageId,
      draftBlocks: blocks,
      hasDraft: true,
    };

    let pageContent;
    if (existingContent) {
      pageContent = await prisma.pageContent.update({
        where: { id: existingContent.id },
        data,
      });
    } else {
      pageContent = await prisma.pageContent.create({
        data: {
          ...data,
          blocks: [], // Initialize with empty published blocks
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: pageContent.id,
      hasDraft: true,
    });
  } catch (error) {
    console.error("Error saving page content:", error);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}
