import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET all email templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { templateKey: "asc" },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST - Create a new email template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      templateKey,
      name,
      subject,
      roleTitle,
      description,
      nextSteps,
      nextStepsIntro,
      requiresOnboarding,
    } = body;

    if (!templateKey || !name || !subject || !description) {
      return NextResponse.json(
        { error: "templateKey, name, subject, and description are required" },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        templateKey,
        name,
        subject,
        roleTitle: roleTitle || null,
        description,
        nextSteps: nextSteps || [],
        nextStepsIntro: nextStepsIntro || null,
        requiresOnboarding: requiresOnboarding || false,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
