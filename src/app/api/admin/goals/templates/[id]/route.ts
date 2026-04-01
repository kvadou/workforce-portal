import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GoalCategory } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/goals/templates/[id] - Update a template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, category, metricType, defaultTarget, isActive } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (metricType !== undefined) updateData.metricType = metricType;
    if (defaultTarget !== undefined) updateData.defaultTarget = defaultTarget;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (category !== undefined) {
      const validCategories: GoalCategory[] = ["TEACHING", "LEARNING", "ENGAGEMENT", "PERFORMANCE"];
      if (validCategories.includes(category)) {
        updateData.category = category;
      }
    }

    const template = await prisma.goalTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update goal template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/goals/templates/[id] - Delete a template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if any goals are using this template
    const goalsUsingTemplate = await prisma.tutorGoal.count({
      where: { templateId: id },
    });

    if (goalsUsingTemplate > 0) {
      // Instead of deleting, just deactivate
      await prisma.goalTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Template deactivated because ${goalsUsingTemplate} goal(s) are using it`
      });
    }

    await prisma.goalTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete goal template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
