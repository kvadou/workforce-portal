import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pagePublishSchema } from "@/lib/validations/page";
import { Prisma } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/pages/[id]/publish - Publish, unpublish, schedule, or archive a page
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = pagePublishSchema.parse(body);

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    let updateData: Parameters<typeof prisma.page.update>[0]["data"] = {};

    switch (validatedData.action) {
      case "publish":
        // Publish the page immediately
        updateData = {
          status: "PUBLISHED",
          publishedAt: new Date(),
          scheduledAt: null,
        };

        // If there's draft content, publish it
        if (existingPage.content?.hasDraft && existingPage.content.draftBlocks) {
          await prisma.pageContent.update({
            where: { id: existingPage.content.id },
            data: {
              blocks: existingPage.content.draftBlocks as Prisma.InputJsonValue,
              draftBlocks: Prisma.DbNull,
              hasDraft: false,
              publishedAt: new Date(),
            },
          });
        }
        break;

      case "unpublish":
        // Revert to draft
        updateData = {
          status: "DRAFT",
          publishedAt: null,
          scheduledAt: null,
        };
        break;

      case "schedule":
        // Schedule for future publication
        if (!validatedData.scheduledAt) {
          return NextResponse.json(
            { error: "scheduledAt is required for scheduling" },
            { status: 400 }
          );
        }

        const scheduledDate = new Date(validatedData.scheduledAt);
        if (scheduledDate <= new Date()) {
          return NextResponse.json(
            { error: "Scheduled date must be in the future" },
            { status: 400 }
          );
        }

        updateData = {
          status: "SCHEDULED",
          scheduledAt: scheduledDate,
        };
        break;

      case "archive":
        // Archive the page
        updateData = {
          status: "ARCHIVED",
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
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
    console.error("Error publishing page:", error);
    return NextResponse.json({ error: "Failed to publish page" }, { status: 500 });
  }
}
