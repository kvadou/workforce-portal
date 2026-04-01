import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
const secret = process.env.INTERNAL_API_SECRET;

/** Look up the logged-in user's TutorCruncher contractor ID. */
async function getContractorId(userId: string): Promise<number | null> {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { tutorCruncherId: true },
  });
  return profile?.tutorCruncherId ?? null;
}

// POST — Submit a referral (proxy to OpsHub)
export async function POST(req: NextRequest) {
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

    const contractorId = await getContractorId(session.user.id);
    if (!contractorId) {
      return NextResponse.json(
        { error: "No TutorCruncher profile linked" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const response = await fetch(`${opsHubUrl}/api/referrals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        contractor_id: contractorId,
        referred_name: body.referred_name,
        referred_email: body.referred_email,
        referred_phone: body.referred_phone,
        referral_type: body.referral_type,
        referring_client_id: body.referring_client_id,
        referring_client_name: body.referring_client_name,
        notes: body.notes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to submit referral" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error submitting referral:", error);
    return NextResponse.json(
      { error: "Failed to submit referral" },
      { status: 500 }
    );
  }
}

// GET — List tutor's referrals (proxy to OpsHub)
export async function GET(req: NextRequest) {
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

    const contractorId = await getContractorId(session.user.id);
    if (!contractorId) {
      return NextResponse.json(
        { error: "No TutorCruncher profile linked" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const params = new URLSearchParams({
      contractor_id: String(contractorId),
    });
    if (status) params.set("status", status);

    const response = await fetch(
      `${opsHubUrl}/api/referrals?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch referrals" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
