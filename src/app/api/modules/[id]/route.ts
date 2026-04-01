import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moduleUpdateSchema } from "@/lib/validations/module";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/modules/[id] - Get a single module
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeLessons = searchParams.get("includeLessons") === "true";

    const foundModule = await prisma.module.findUnique({
      where: { id },
      include: {
        curriculum: true,
        ...(includeLessons
          ? {
              lessons: {
                orderBy: { order: "asc" },
              },
            }
          : {
              _count: { select: { lessons: true } },
            }),
      },
    });

    if (!foundModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json(foundModule);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}

// PUT /api/modules/[id] - Update a module
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = moduleUpdateSchema.parse(body);

    const updatedModule = await prisma.module.update({
      where: { id },
      data: validatedData,
      include: {
        _count: { select: { lessons: true } },
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error("Error updating module:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE /api/modules/[id] - Delete a module
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
