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
 * GET /api/admin/tutors/[id]/charges
 * Fetch ad-hoc charges for a tutor via OpsHub entity-details proxy.
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

    if (!opsHubUrl || !secret) {
      return NextResponse.json({ error: "OpsHub not configured" }, { status: 503 });
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
      return NextResponse.json({ charges: [], message: "No TutorCruncher ID" });
    }

    // Fetch from OpsHub entity-details which includes ad-hoc charges
    const response = await fetch(
      `${opsHubUrl}/api/entity-details/tutors/${tutorProfile.tutorCruncherId}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from OpsHub" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Extract ad-hoc charges from the entity details response
    const charges = data.adhoc_charges || data.adhocCharges || [];

    return NextResponse.json({ charges });
  } catch (error) {
    console.error("Error fetching tutor charges:", error);
    return NextResponse.json({ error: "Failed to fetch charges" }, { status: 500 });
  }
}

/**
 * POST /api/admin/tutors/[id]/charges
 * Create an ad-hoc charge via OpsHub proxy.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!opsHubUrl || !secret) {
      return NextResponse.json({ error: "OpsHub not configured" }, { status: 503 });
    }

    const { id } = await params;

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      select: { tutorCruncherId: true },
    });

    if (!tutorProfile?.tutorCruncherId) {
      return NextResponse.json({ error: "Tutor not linked to TutorCruncher" }, { status: 400 });
    }

    const body = await req.json();

    const response = await fetch(`${opsHubUrl}/api/adhoc-charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        contractor_id: tutorProfile.tutorCruncherId,
        category_id: body.category_id,
        description: body.description,
        date_occurred: body.date_occurred,
        pay_contractor: body.pay_contractor,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create charge" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating charge:", error);
    return NextResponse.json({ error: "Failed to create charge" }, { status: 500 });
  }
}
