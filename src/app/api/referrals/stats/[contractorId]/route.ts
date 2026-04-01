import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
const secret = process.env.INTERNAL_API_SECRET;

// GET — Tutor referral stats (proxy to OpsHub)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!opsHubUrl || !secret) {
      return NextResponse.json(
        { error: "Referral service not configured" },
        { status: 503 }
      );
    }

    const { contractorId } = await params;

    // Verify the requesting user owns this contractor ID (prevent enumeration)
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { tutorCruncherId: true },
    });

    if (!profile?.tutorCruncherId || String(profile.tutorCruncherId) !== contractorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const response = await fetch(
      `${opsHubUrl}/api/referrals/stats/${contractorId}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch stats" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
