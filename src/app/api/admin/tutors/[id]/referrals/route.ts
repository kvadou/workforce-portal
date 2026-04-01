import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
const secret = process.env.INTERNAL_API_SECRET;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/referrals
 * Fetch referrals for a specific tutor via OpsHub proxy.
 * Admin-only — uses the tutor's TC contractor ID to filter.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!opsHubUrl || !secret) {
      return NextResponse.json({ error: "Referral service not configured" }, { status: 503 });
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
      return NextResponse.json({ referrals: [], stats: null, message: "No TutorCruncher ID" });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Fetch referrals and stats in parallel from OpsHub
    const queryParams = new URLSearchParams({
      contractor_id: String(tutorProfile.tutorCruncherId),
    });
    if (status) queryParams.set("status", status);

    const [referralsRes, statsRes] = await Promise.all([
      fetch(`${opsHubUrl}/api/referrals?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      fetch(`${opsHubUrl}/api/referrals/stats/${tutorProfile.tutorCruncherId}`, {
        headers: { Authorization: `Bearer ${secret}` },
      }),
    ]);

    const referralsData = referralsRes.ok ? await referralsRes.json() : { referrals: [] };
    const statsData = statsRes.ok ? await statsRes.json() : { stats: null };

    return NextResponse.json({
      referrals: referralsData.referrals || [],
      stats: statsData.stats || null,
    });
  } catch (error) {
    console.error("Error fetching tutor referrals:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
