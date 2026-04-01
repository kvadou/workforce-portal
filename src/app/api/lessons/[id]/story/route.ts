import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storyContentSchema } from "@/lib/validations/lesson";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/lessons/[id]/story - Get story content
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const story = await prisma.storyContent.findUnique({
      where: { lessonId: id },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/story - Create or update story content
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = storyContentSchema.parse(body);

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const story = await prisma.storyContent.upsert({
      where: { lessonId: id },
      create: {
        lessonId: id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json(story);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error updating story:", error);
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 });
  }
}

// DELETE /api/lessons/[id]/story - Delete story content
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.storyContent.delete({
      where: { lessonId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    console.error("Error deleting story:", error);
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
  }
}
