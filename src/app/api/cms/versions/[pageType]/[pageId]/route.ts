import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch version history for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string; pageId: string }> }
) {
  try {
    const { pageType, pageId } = await params;
    const session = await getServerSession(authOptions);

    // Must be admin to view versions
    const isAdmin =
      session?.user?.role === "SUPER_ADMIN" ||
      session?.user?.role === "ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Find page content
    const pageContent = await prisma.pageContent.findUnique({
      where: {
        pageType_pageId: {
          pageType,
          pageId,
        },
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 50, // Limit to last 50 versions
        },
      },
    });

    if (!pageContent) {
      return NextResponse.json({ versions: [] });
    }

    return NextResponse.json({
      versions: pageContent.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        createdBy: v.createdBy,
        createdAt: v.createdAt,
        note: v.note,
      })),
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

// POST - Restore a specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string; pageId: string }> }
) {
  try {
    const { pageType, pageId } = await params;
    const session = await getServerSession(authOptions);

    // Must be admin to restore versions
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
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
        { status: 400 }
      );
    }

    // Find the version
    const version = await prisma.pageVersion.findUnique({
      where: { id: versionId },
      include: { pageContent: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Verify it belongs to the right page
    if (
      version.pageContent.pageType !== pageType ||
      version.pageContent.pageId !== pageId
    ) {
      return NextResponse.json(
        { error: "Version does not belong to this page" },
        { status: 400 }
      );
    }

    // Create a new version of current state before restoring
    const versionCount = await prisma.pageVersion.count({
      where: { pageContentId: version.pageContentId },
    });

    await prisma.pageVersion.create({
      data: {
        pageContentId: version.pageContentId,
        blocks: version.pageContent.blocks || [],
        versionNumber: versionCount + 1,
        createdBy: session?.user?.id || "unknown",
        note: `Auto-saved before restoring version ${version.versionNumber}`,
      },
    });

    // Restore the version as draft
    const restoredBlocks = version.blocks || [];
    await prisma.pageContent.update({
      where: { id: version.pageContentId },
      data: {
        draftBlocks: restoredBlocks,
        hasDraft: true,
      },
    });

    return NextResponse.json({
      success: true,
      blocks: version.blocks,
      hasDraft: true,
      message: `Restored version ${version.versionNumber} as draft`,
    });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
