import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pageReorderSchema } from "@/lib/validations/page";

// PUT /api/pages/reorder - Batch reorder pages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = pageReorderSchema.parse(body);

    // Update all pages in a transaction
    await prisma.$transaction(
      validatedData.pages.map((page) =>
        prisma.page.update({
          where: { id: page.id },
          data: { order: page.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error reordering pages:", error);
    return NextResponse.json({ error: "Failed to reorder pages" }, { status: 500 });
  }
}
