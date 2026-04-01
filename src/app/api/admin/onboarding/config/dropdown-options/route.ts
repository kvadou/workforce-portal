import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET all dropdown options or by fieldKey
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fieldKey = searchParams.get("fieldKey") || searchParams.get("category"); // Support both for backwards compat

    const options = await prisma.onboardingDropdownOption.findMany({
      where: fieldKey ? { fieldKey, isActive: true } : { isActive: true },
      orderBy: [{ fieldKey: "asc" }, { order: "asc" }],
    });

    // Group by fieldKey for easier consumption
    const grouped = options.reduce((acc, option) => {
      if (!acc[option.fieldKey]) {
        acc[option.fieldKey] = [];
      }
      acc[option.fieldKey].push(option);
      return acc;
    }, {} as Record<string, typeof options>);

    return NextResponse.json({ success: true, options, grouped });
  } catch (error) {
    console.error("Error fetching dropdown options:", error);
    return NextResponse.json(
      { error: "Failed to fetch dropdown options" },
      { status: 500 }
    );
  }
}

// POST - Create new dropdown option
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fieldKey, category, value, label, order } = body; // Support both fieldKey and category

    const option = await prisma.onboardingDropdownOption.create({
      data: {
        fieldKey: fieldKey || category, // Prefer fieldKey, fallback to category
        value,
        label,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Error creating dropdown option:", error);
    return NextResponse.json(
      { error: "Failed to create dropdown option" },
      { status: 500 }
    );
  }
}

// PUT - Update dropdown option(s) or reorder
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Handle reorder operation
    if (body.reorder && Array.isArray(body.items)) {
      const updates = await Promise.all(
        body.items.map(({ id, order }: { id: string; order: number }) =>
          prisma.onboardingDropdownOption.update({
            where: { id },
            data: { order },
          })
        )
      );
      return NextResponse.json({ success: true, options: updates });
    }

    // Handle bulk update for a fieldKey (supports category for backwards compat)
    const bulkFieldKey = body.fieldKey || body.category;
    if (bulkFieldKey && Array.isArray(body.options)) {
      // Delete existing inactive options first, then upsert
      const results = await Promise.all(
        body.options.map(
          async ({
            id,
            value,
            label,
            order,
          }: {
            id?: string;
            value: string;
            label: string;
            order: number;
          }) => {
            if (id) {
              return prisma.onboardingDropdownOption.update({
                where: { id },
                data: { value, label, order, isActive: true },
              });
            }
            return prisma.onboardingDropdownOption.create({
              data: {
                fieldKey: bulkFieldKey,
                value,
                label,
                order,
              },
            });
          }
        )
      );
      return NextResponse.json({ success: true, options: results });
    }

    // Single option update
    const { id, value, label, order } = body;

    const option = await prisma.onboardingDropdownOption.update({
      where: { id },
      data: { value, label, order },
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Error updating dropdown option:", error);
    return NextResponse.json(
      { error: "Failed to update dropdown option" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete dropdown option
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    await prisma.onboardingDropdownOption.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dropdown option:", error);
    return NextResponse.json(
      { error: "Failed to delete dropdown option" },
      { status: 500 }
    );
  }
}
