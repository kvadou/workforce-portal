import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chessercisesSchema } from "@/lib/validations/lesson";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/lessons/[id]/chessercises - Get chessercises
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { chessercises: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson.chessercises || { warmUp: null, dressUp: null, chessUp: null });
  } catch (error) {
    console.error("Error fetching chessercises:", error);
    return NextResponse.json({ error: "Failed to fetch chessercises" }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/chessercises - Update chessercises
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = chessercisesSchema.parse(body);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: { chessercises: validatedData },
      select: { chessercises: true },
    });

    return NextResponse.json(lesson.chessercises);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    console.error("Error updating chessercises:", error);
    return NextResponse.json({ error: "Failed to update chessercises" }, { status: 500 });
  }
}
