import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exerciseUpdateSchema } from "@/lib/validations/lesson";

interface Params {
  params: Promise<{ id: string; exerciseId: string }>;
}

// GET /api/lessons/[id]/exercises/[exerciseId] - Get a single exercise
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { exerciseId } = await params;

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return NextResponse.json({ error: "Failed to fetch exercise" }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/exercises/[exerciseId] - Update an exercise
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { exerciseId } = await params;
    const body = await request.json();
    const validatedData = exerciseUpdateSchema.parse(body);

    const exercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: validatedData,
    });

    return NextResponse.json(exercise);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }
    console.error("Error updating exercise:", error);
    return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
  }
}

// DELETE /api/lessons/[id]/exercises/[exerciseId] - Delete an exercise
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { exerciseId } = await params;

    await prisma.exercise.delete({
      where: { id: exerciseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }
    console.error("Error deleting exercise:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}
