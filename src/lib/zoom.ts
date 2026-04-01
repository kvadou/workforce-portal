/**
 * Zoom API Client
 *
 * Uses Server-to-Server OAuth for backend integrations.
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET env vars.
 */

import crypto from "crypto";

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZoomMeeting {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  start_url: string;
  password?: string;
}

interface CreateMeetingParams {
  topic: string;
  startTime: Date;
  duration: number; // minutes
  timezone?: string;
  agenda?: string;
  hostEmail?: string;
}

interface ZoomParticipant {
  id: string;
  user_id: string;
  user_name: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
}

// Token cache
let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Check if Zoom is configured
 */
export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  );
}

/**
 * Get Zoom access token using Server-to-Server OAuth
 */
async function getAccessToken(): Promise<string> {
  // Check cache
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Zoom token error:", error);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }

  const data: ZoomTokenResponse = await response.json();

  // Cache token (expire 5 minutes early to be safe)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Make authenticated request to Zoom API
 */
async function zoomRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`https://api.zoom.us/v2${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Zoom API error (${endpoint}):`, error);
    throw new Error(`Zoom API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Create a Zoom meeting
 */
export async function createMeeting(params: CreateMeetingParams): Promise<ZoomMeeting> {
  const { topic, startTime, duration, timezone = "America/New_York", agenda, hostEmail } = params;

  // Use "me" for the authenticated user, or specify a user email
  const userId = hostEmail || "me";

  const meeting = await zoomRequest<ZoomMeeting>(`/users/${userId}/meetings`, {
    method: "POST",
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting
      start_time: startTime.toISOString(),
      duration,
      timezone,
      agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        watermark: false,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        audio: "both",
        auto_recording: "none",
        waiting_room: true,
      },
    }),
  });

  return meeting;
}

/**
 * Get meeting details
 */
export async function getMeeting(meetingId: string | number): Promise<ZoomMeeting> {
  return zoomRequest<ZoomMeeting>(`/meetings/${meetingId}`);
}

/**
 * Update a meeting
 */
export async function updateMeeting(
  meetingId: string | number,
  params: Partial<CreateMeetingParams>
): Promise<void> {
  await zoomRequest(`/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify({
      topic: params.topic,
      start_time: params.startTime?.toISOString(),
      duration: params.duration,
      agenda: params.agenda,
    }),
  });
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(meetingId: string | number): Promise<void> {
  await zoomRequest(`/meetings/${meetingId}`, {
    method: "DELETE",
  });
}

/**
 * Get meeting participants (for past meetings)
 */
export async function getMeetingParticipants(
  meetingId: string
): Promise<{ participants: ZoomParticipant[] }> {
  return zoomRequest<{ participants: ZoomParticipant[] }>(
    `/past_meetings/${meetingId}/participants`
  );
}

/**
 * Verify Zoom webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET;

  if (!secret) {
    console.error("ZOOM_WEBHOOK_SECRET not configured");
    return false;
  }

  const message = `v0:${timestamp}:${payload}`;
  const hashForVerify = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  const expectedSignature = `v0=${hashForVerify}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}

/**
 * Handle Zoom webhook URL validation (CRC challenge)
 */
export function handleWebhookValidation(plainToken: string): { plainToken: string; encryptedToken: string } {
  const secret = process.env.ZOOM_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("ZOOM_WEBHOOK_SECRET not configured");
  }

  const encryptedToken = crypto
    .createHmac("sha256", secret)
    .update(plainToken)
    .digest("hex");

  return { plainToken, encryptedToken };
}

// Re-export types
export type { ZoomMeeting, ZoomParticipant, CreateMeetingParams };
