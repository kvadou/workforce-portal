import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { moduleReorderSchema } from "@/lib/validations/module";

// PUT /api/modules/reorder - Reorder modules
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { modules } = moduleReorderSchema.parse(body);

    // Update all modules in a transaction
    await prisma.$transaction(
      modules.map((module) =>
        prisma.module.update({
          where: { id: module.id },
          data: { order: module.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error reordering modules:", error);
    return NextResponse.json({ error: "Failed to reorder modules" }, { status: 500 });
  }
}
