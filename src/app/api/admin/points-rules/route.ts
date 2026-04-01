import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateRulesCache, seedDefaultPointsRules } from "@/lib/points-engine";
import type { PointsCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/points-rules - Get all points rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rules = await prisma.pointsRule.findMany({
      orderBy: [{ category: "asc" }, { points: "desc" }],
    });

    // Group by category for easier display
    const groupedRules = rules.reduce((acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push(rule);
      return acc;
    }, {} as Record<string, typeof rules>);

    return NextResponse.json({
      rules,
      groupedRules,
      total: rules.length,
    });
  } catch (error) {
    console.error("Failed to fetch points rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch points rules" },
      { status: 500 }
    );
  }
}

// POST /api/admin/points-rules - Create a new points rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, trigger, points, threshold, multiplier, isActive } = body;

    // Validate required fields
    if (!name || !category || !trigger || points === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, trigger, points" },
        { status: 400 }
      );
    }

    // Check for duplicate trigger
    const existing = await prisma.pointsRule.findUnique({
      where: { trigger },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A rule with this trigger already exists" },
        { status: 409 }
      );
    }

    const rule = await prisma.pointsRule.create({
      data: {
        name,
        description,
        category: category as PointsCategory,
        trigger,
        points: parseInt(points, 10),
        threshold: threshold ? parseInt(threshold, 10) : null,
        multiplier: multiplier ? parseFloat(multiplier) : null,
        isActive: isActive ?? true,
      },
    });

    // Invalidate cache
    invalidateRulesCache();

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create points rule:", error);
    return NextResponse.json(
      { error: "Failed to create points rule" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/points-rules - Update a points rule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, category, trigger, points, threshold, multiplier, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    // Check if rule exists
    const existing = await prisma.pointsRule.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Check for duplicate trigger if changing it
    if (trigger && trigger !== existing.trigger) {
      const duplicateTrigger = await prisma.pointsRule.findUnique({
        where: { trigger },
      });
      if (duplicateTrigger) {
        return NextResponse.json(
          { error: "A rule with this trigger already exists" },
          { status: 409 }
        );
      }
    }

    const rule = await prisma.pointsRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category: category as PointsCategory }),
        ...(trigger && { trigger }),
        ...(points !== undefined && { points: parseInt(points, 10) }),
        ...(threshold !== undefined && { threshold: threshold ? parseInt(threshold, 10) : null }),
        ...(multiplier !== undefined && { multiplier: multiplier ? parseFloat(multiplier) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Invalidate cache
    invalidateRulesCache();

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Failed to update points rule:", error);
    return NextResponse.json(
      { error: "Failed to update points rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/points-rules - Delete a points rule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    await prisma.pointsRule.delete({
      where: { id },
    });

    // Invalidate cache
    invalidateRulesCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete points rule:", error);
    return NextResponse.json(
      { error: "Failed to delete points rule" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/points-rules - Seed default rules
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await seedDefaultPointsRules();

    return NextResponse.json({ success: true, message: "Default rules seeded" });
  } catch (error) {
    console.error("Failed to seed default rules:", error);
    return NextResponse.json(
      { error: "Failed to seed default rules" },
      { status: 500 }
    );
  }
}
