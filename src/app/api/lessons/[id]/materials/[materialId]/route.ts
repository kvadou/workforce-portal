import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { printMaterialUpdateSchema } from "@/lib/validations/lesson";

interface Params {
  params: Promise<{ id: string; materialId: string }>;
}

// GET /api/lessons/[id]/materials/[materialId] - Get a single material
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { materialId } = await params;

    const material = await prisma.printMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching material:", error);
    return NextResponse.json({ error: "Failed to fetch material" }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/materials/[materialId] - Update a material
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { materialId } = await params;
    const body = await request.json();
    const validatedData = printMaterialUpdateSchema.parse(body);

    const material = await prisma.printMaterial.update({
      where: { id: materialId },
      data: validatedData,
    });

    return NextResponse.json(material);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

// DELETE /api/lessons/[id]/materials/[materialId] - Delete a material
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { materialId } = await params;

    await prisma.printMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
