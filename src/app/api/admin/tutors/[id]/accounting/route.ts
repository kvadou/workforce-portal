import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorCruncherPaymentOrders } from "@/lib/integrations/tutorcruncher";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/accounting
 * Fetch TutorCruncher payment orders for a tutor.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      select: { tutorCruncherId: true },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    if (!tutorProfile.tutorCruncherId) {
      return NextResponse.json({ paymentOrders: [], message: "No TutorCruncher ID" });
    }

    const result = await getTutorCruncherPaymentOrders(tutorProfile.tutorCruncherId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch payment orders" },
        { status: 502 }
      );
    }

    return NextResponse.json({ paymentOrders: result.data?.results || [] });
  } catch (error) {
    console.error("Error fetching tutor accounting:", error);
    return NextResponse.json({ error: "Failed to fetch accounting data" }, { status: 500 });
  }
}
