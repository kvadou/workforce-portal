import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { recordAuditLog, recordStatusChange, recordFieldUpdate } from "@/lib/audit-log";
import type { TutorStatus, TutorTeam } from "@prisma/client";

// TutorCruncher webhook secret for signature verification
const TC_WEBHOOK_SECRET = process.env.TUTORCRUNCHER_WEBHOOK_SECRET || "";

/**
 * TutorCruncher webhook payload structure
 * Based on actual webhook data received
 */
interface TCWebhookPayload {
  events: TCEvent[];
  request_time: number;
}

interface TCEvent {
  action: string;
  verb: string;
  timestamp: string;
  branch: number;
  actor: {
    name: string;
    id: number;
    user_id: number;
    url: string;
  };
  extra_msg: string;
  subject: TCContractor;
}

interface TCContractor {
  model: string;
  url: string;
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string | null;
  phone?: string | null;
  street?: string;
  state?: string;
  town?: string;
  country?: string;
  postcode?: string;
  status: string;
  default_rate?: string;
  date_created: string;
  labels?: Array<{
    id: number;
    name: string;
    machine_name: string;
    url: string;
  }>;
  extra_attrs?: Array<{
    id: number;
    value: string;
    type: string;
    machine_name: string;
    name: string;
  }>;
}

/**
 * Map TutorCruncher status to STT TutorStatus
 */
function mapTCStatusToSTT(tcStatus: string): TutorStatus {
  const statusMap: Record<string, TutorStatus> = {
    approved: "ACTIVE",
    pending: "PENDING",
    suspended: "INACTIVE",
    dormant: "INACTIVE",
  };
  return statusMap[tcStatus.toLowerCase()] || "PENDING";
}

/**
 * Map state to team
 */
function mapStateToTeam(state: string | undefined): TutorTeam | null {
  if (!state) return null;

  const normalized = state.toLowerCase().trim();

  if (normalized.includes("new york") || normalized.includes("(ny)") || normalized === "ny") {
    return "NYC";
  }
  if (normalized.includes("new jersey") || normalized.includes("(nj)") || normalized === "nj") {
    return "NYC"; // NJ tutors work NYC area
  }
  if (normalized.includes("california") || normalized.includes("(ca)") || normalized === "ca") {
    return "LA";
  }
  if (normalized.includes("san francisco") || normalized === "sf") {
    return "SF";
  }

  return "ONLINE";
}

/**
 * Verify TutorCruncher webhook signature
 * TutorCruncher uses HMAC-SHA256 signature in webhook-signature header
 */
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!TC_WEBHOOK_SECRET) {
    console.warn("TUTORCRUNCHER_WEBHOOK_SECRET not set, skipping signature verification");
    return true; // Allow in development
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", TC_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // TutorCruncher sends raw hex signature (no prefix)
    return crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    );
  } catch (err) {
    console.error("[TC Webhook] Signature verification error:", err);
    return false;
  }
}

/**
 * Extract label names from TC labels array
 */
function extractLabelNames(labels?: TCContractor["labels"]): string[] {
  if (!labels) return [];
  return labels.map((l) => l.name);
}

/**
 * Process a single contractor event
 */
async function processContractorEvent(
  event: TCEvent
): Promise<{ success: boolean; message: string; tutorProfileId?: string }> {
  const contractor = event.subject;

  // Only process Tutor model events
  if (contractor.model !== "Tutor") {
    return { success: true, message: `Skipped non-tutor model: ${contractor.model}` };
  }

  console.log(`[TC Webhook] Processing ${event.action} for contractor ${contractor.id} (${contractor.email})`);

  // Find existing tutor by TutorCruncher ID or email
  let tutorProfile = await prisma.tutorProfile.findFirst({
    where: {
      OR: [
        { tutorCruncherId: contractor.id },
        { user: { email: contractor.email.toLowerCase() } },
      ],
    },
    include: {
      user: true,
      labels: true,
    },
  });

  // Handle different action types
  const action = event.action.toUpperCase();

  // Actions that create/update contractors
  if (
    action.includes("CREATED") ||
    action.includes("SIGNED_UP") ||
    action.includes("ADDED")
  ) {
    if (!tutorProfile) {
      // Create new user and tutor profile
      const hqOrg = await prisma.organization.findFirst({
        where: { isHQ: true },
      });

      const user = await prisma.user.create({
        data: {
          email: contractor.email.toLowerCase(),
          name: `${contractor.first_name} ${contractor.last_name}`.trim(),
          phone: contractor.phone || contractor.mobile || null,
          passwordHash: "", // Will need to set password
          role: "TUTOR",
          organizationId: hqOrg?.id || null,
          isOnboarding: false,
        },
      });

      const newProfile = await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          tutorCruncherId: contractor.id,
          status: mapTCStatusToSTT(contractor.status),
          team: mapStateToTeam(contractor.state),
          baseHourlyRate: contractor.default_rate ? parseFloat(contractor.default_rate) : undefined,
        },
      });

      // Add labels from TutorCruncher
      const labelNames = extractLabelNames(contractor.labels);
      for (const labelName of labelNames) {
        await prisma.tutorLabel.upsert({
          where: {
            tutorProfileId_name: {
              tutorProfileId: newProfile.id,
              name: labelName,
            },
          },
          create: {
            tutorProfileId: newProfile.id,
            name: labelName,
            createdBy: "tutorcruncher-webhook",
          },
          update: {},
        });
      }

      await recordAuditLog({
        tutorProfileId: newProfile.id,
        action: "TC_SYNC_CREATED",
        metadata: { tutorCruncherId: contractor.id, tcAction: event.action },
        performedBy: "tutorcruncher-webhook",
        performedByName: "TutorCruncher Webhook",
      });

      console.log(`[TC Webhook] Created new tutor profile ${newProfile.id} for TC ID ${contractor.id}`);

      return {
        success: true,
        message: "Tutor profile created",
        tutorProfileId: newProfile.id,
      };
    } else {
      // Link existing profile to TC ID if not already linked
      if (!tutorProfile.tutorCruncherId) {
        await prisma.tutorProfile.update({
          where: { id: tutorProfile.id },
          data: { tutorCruncherId: contractor.id },
        });

        await recordAuditLog({
          tutorProfileId: tutorProfile.id,
          action: "TC_LINKED",
          field: "tutorCruncherId",
          newValue: String(contractor.id),
          performedBy: "tutorcruncher-webhook",
          performedByName: "TutorCruncher Webhook",
        });
      }
    }
  }

  // If we still don't have a profile, we can't process further
  if (!tutorProfile) {
    // Try to create the profile for any tutor event
    const hqOrg = await prisma.organization.findFirst({
      where: { isHQ: true },
    });

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: contractor.email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: contractor.email.toLowerCase(),
          name: `${contractor.first_name} ${contractor.last_name}`.trim(),
          phone: contractor.phone || contractor.mobile || null,
          passwordHash: "",
          role: "TUTOR",
          organizationId: hqOrg?.id || null,
          isOnboarding: false,
        },
      });
    }

    tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: user.id,
        tutorCruncherId: contractor.id,
        status: mapTCStatusToSTT(contractor.status),
        team: mapStateToTeam(contractor.state),
        baseHourlyRate: contractor.default_rate ? parseFloat(contractor.default_rate) : undefined,
      },
      include: {
        user: true,
        labels: true,
      },
    });

    await recordAuditLog({
      tutorProfileId: tutorProfile.id,
      action: "TC_SYNC_CREATED",
      metadata: { tutorCruncherId: contractor.id, tcAction: event.action },
      performedBy: "tutorcruncher-webhook",
      performedByName: "TutorCruncher Webhook",
    });

    console.log(`[TC Webhook] Auto-created tutor profile ${tutorProfile.id} for TC ID ${contractor.id}`);
  }

  // Sync labels
  if (action.includes("LABEL")) {
    const tcLabelNames = extractLabelNames(contractor.labels);
    const existingLabels = tutorProfile.labels.map((l) => l.name);

    // Add new labels
    for (const labelName of tcLabelNames) {
      if (!existingLabels.includes(labelName)) {
        await prisma.tutorLabel.create({
          data: {
            tutorProfileId: tutorProfile.id,
            name: labelName,
            createdBy: "tutorcruncher-webhook",
          },
        });
        console.log(`[TC Webhook] Added label "${labelName}" to ${tutorProfile.id}`);
      }
    }

    await recordAuditLog({
      tutorProfileId: tutorProfile.id,
      action: "TC_LABELS_SYNCED",
      metadata: { labels: tcLabelNames, tcAction: event.action },
      performedBy: "tutorcruncher-webhook",
      performedByName: "TutorCruncher Webhook",
    });
  }

  // Handle status changes
  if (action.includes("STATUS") || action.includes("APPROVED") || action.includes("SUSPENDED")) {
    const newStatus = mapTCStatusToSTT(contractor.status);
    const previousStatus = tutorProfile.status;

    if (previousStatus !== newStatus) {
      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { status: newStatus },
      });

      await recordStatusChange(
        tutorProfile.id,
        previousStatus,
        newStatus,
        "tutorcruncher-webhook",
        "TutorCruncher Webhook"
      );

      console.log(`[TC Webhook] Status changed for ${tutorProfile.id}: ${previousStatus} -> ${newStatus}`);
    }
  }

  // Sync basic info on any update
  if (action.includes("EDITED") || action.includes("UPDATED") || action.includes("CHANGED")) {
    const updates: { name?: string; phone?: string } = {};
    const fullName = `${contractor.first_name} ${contractor.last_name}`.trim();

    if (tutorProfile.user.name !== fullName) {
      updates.name = fullName;
    }
    const phone = contractor.phone || contractor.mobile;
    if (phone && tutorProfile.user.phone !== phone) {
      updates.phone = phone;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: tutorProfile.user.id },
        data: updates,
      });

      for (const [field, value] of Object.entries(updates)) {
        await recordFieldUpdate(
          tutorProfile.id,
          field,
          field === "name" ? tutorProfile.user.name : tutorProfile.user.phone,
          value,
          "tutorcruncher-webhook",
          "TutorCruncher Webhook"
        );
      }
    }

    // Update hourly rate if changed
    const newRate = contractor.default_rate ? parseFloat(contractor.default_rate) : null;
    if (newRate !== null && Number(tutorProfile.baseHourlyRate) !== newRate) {
      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { baseHourlyRate: newRate },
      });

      await recordFieldUpdate(
        tutorProfile.id,
        "baseHourlyRate",
        tutorProfile.baseHourlyRate?.toString(),
        String(newRate),
        "tutorcruncher-webhook",
        "TutorCruncher Webhook"
      );
    }
  }

  // Log any unhandled action for debugging
  await recordAuditLog({
    tutorProfileId: tutorProfile.id,
    action: "TC_EVENT_RECEIVED",
    metadata: { tcAction: event.action, verb: event.verb },
    performedBy: "tutorcruncher-webhook",
    performedByName: "TutorCruncher Webhook",
  });

  return {
    success: true,
    message: `Processed ${event.action}`,
    tutorProfileId: tutorProfile.id,
  };
}

/**
 * POST /api/webhooks/tutorcruncher
 * Receives contractor events from TutorCruncher and syncs with TutorProfile
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("webhook-signature") || "";

    // Verify webhook signature
    if (!TC_WEBHOOK_SECRET) {
      console.error("[TC Webhook] TUTORCRUNCHER_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      console.warn("[TC Webhook] Invalid or missing signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload: TCWebhookPayload = JSON.parse(rawBody);

    console.log(`[TC Webhook] Processing ${payload.events.length} events`);

    const results = [];
    for (const event of payload.events) {
      try {
        const result = await processContractorEvent(event);
        results.push(result);
      } catch (eventError) {
        console.error(`[TC Webhook] Error processing event ${event.action}:`, eventError);
        results.push({
          success: false,
          message: `Error: ${eventError instanceof Error ? eventError.message : "Unknown error"}`,
        });
      }
    }

    return NextResponse.json({
      message: "Webhook processed",
      results,
    });
  } catch (error) {
    console.error("[TC Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/tutorcruncher
 * Health check endpoint for TutorCruncher to verify webhook is active
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "WorkforcePortal TutorCruncher Webhook",
    version: "2.0.0",
  });
}
