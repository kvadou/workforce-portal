import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GoalStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/goals/[id] - Get a specific goal
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.tutorGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        template: true,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Failed to fetch goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, targetValue, currentValue, endDate, status } = body;

    // Verify ownership
    const existingGoal = await prisma.tutorGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (targetValue !== undefined) updateData.targetValue = targetValue;
    if (currentValue !== undefined) {
      updateData.currentValue = currentValue;
      // Auto-complete if target reached
      if (currentValue >= existingGoal.targetValue && existingGoal.status === "IN_PROGRESS") {
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
      }
    }
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) {
      const validStatuses: GoalStatus[] = ["IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"];
      if (validStatuses.includes(status)) {
        updateData.status = status;
        if (status === "COMPLETED" && !existingGoal.completedAt) {
          updateData.completedAt = new Date();
        }
      }
    }

    const goal = await prisma.tutorGoal.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Failed to update goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingGoal = await prisma.tutorGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.tutorGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
