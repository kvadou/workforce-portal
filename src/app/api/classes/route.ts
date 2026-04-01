import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/classes - Get classes for current user or specified instructor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeStudents = searchParams.get("includeStudents") === "true";

    // Allow admin to query any instructor's classes, otherwise use current user
    const requestedInstructorId = searchParams.get("instructorId");
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";

    // Use requested ID if admin, otherwise always use current user's ID
    const instructorId = (isAdmin && requestedInstructorId)
      ? requestedInstructorId
      : session.user.id;

    const classes = await prisma.class.findMany({
      where: { instructorId },
      include: {
        students: includeStudents,
        currentLesson: {
          select: {
            id: true,
            title: true,
            number: true,
            module: {
              select: {
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create a new class for current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, color, instructorId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Allow admin to create class for another instructor, otherwise use current user
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    const targetInstructorId = (isAdmin && instructorId)
      ? instructorId
      : session.user.id;

    const newClass = await prisma.class.create({
      data: {
        instructorId: targetInstructorId,
        name,
        description,
        color,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Failed to create class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
