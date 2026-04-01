import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessions = await prisma.orientationSession.findMany({
      where: { isActive: true },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        duration: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Cohort Sessions API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orientation sessions" },
      { status: 500 }
    );
  }
}
