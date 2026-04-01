/**
 * Google Groups Integration
 *
 * Uses Google Admin SDK Directory API with service account auth
 * and domain-wide delegation to manage tutor Google Group membership.
 *
 * Ported from tcinc-dashboard/backend/google-groups-manager.js
 */

import { google } from "googleapis";

const GOOGLE_ADMIN_EMAIL =
  process.env.GOOGLE_ADMIN_EMAIL || "doug.kvamme@chessat3.com";

// Tutor group map
const TUTOR_GROUPS: Record<string, string> = {
  "la-tutors": "la-tutors@acmeworkforce.com",
  "sf-tutors": "sf-tutors@acmeworkforce.com",
  "ca-tutors": "ca-tutors@acmeworkforce.com",
  "nyc-tutors": "nyc-tutors@acmeworkforce.com",
  "online-tutors": "online-tutors@acmeworkforce.com",
  "school-tutors": "school-tutors@acmeworkforce.com",
};

interface GroupResult {
  success: boolean;
  message: string;
  alreadyExists?: boolean;
  error?: string;
}

function getAdminClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set"
    );
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.group",
      "https://www.googleapis.com/auth/admin.directory.group.member",
    ],
    subject: GOOGLE_ADMIN_EMAIL,
  });

  return google.admin({ version: "directory_v1", auth });
}

/**
 * Add a member to a Google Group
 */
export async function addToGoogleGroup(
  email: string,
  groupKey: string
): Promise<GroupResult> {
  try {
    const admin = getAdminClient();

    await admin.members.insert({
      groupKey,
      requestBody: {
        email,
        role: "MEMBER",
      },
    });

    return {
      success: true,
      message: `Added ${email} to ${groupKey}`,
    };
  } catch (error: unknown) {
    const apiError = error as { code?: number; message?: string };
    if (apiError.code === 409) {
      return {
        success: true,
        message: `${email} is already a member of ${groupKey}`,
        alreadyExists: true,
      };
    }

    console.error(`Failed to add ${email} to ${groupKey}:`, apiError.message);
    return {
      success: false,
      message: `Failed to add ${email} to ${groupKey}`,
      error: apiError.message || "Unknown error",
    };
  }
}

/**
 * Remove a member from a Google Group
 */
export async function removeFromGoogleGroup(
  email: string,
  groupKey: string
): Promise<GroupResult> {
  try {
    const admin = getAdminClient();

    await admin.members.delete({
      groupKey,
      memberKey: email,
    });

    return {
      success: true,
      message: `Removed ${email} from ${groupKey}`,
    };
  } catch (error: unknown) {
    const apiError = error as { code?: number; message?: string };
    if (apiError.code === 404) {
      return {
        success: true,
        message: `${email} is not a member of ${groupKey}`,
      };
    }

    console.error(
      `Failed to remove ${email} from ${groupKey}:`,
      apiError.message
    );
    return {
      success: false,
      message: `Failed to remove ${email} from ${groupKey}`,
      error: apiError.message || "Unknown error",
    };
  }
}

/**
 * Check if a user is a member of a group
 */
export async function checkGroupMembership(
  email: string,
  groupKey: string
): Promise<{ isMember: boolean; error?: string }> {
  try {
    const admin = getAdminClient();

    await admin.members.get({
      groupKey,
      memberKey: email,
    });

    return { isMember: true };
  } catch (error: unknown) {
    const apiError = error as { code?: number; message?: string };
    if (apiError.code === 404) {
      return { isMember: false };
    }
    return { isMember: false, error: apiError.message };
  }
}

/**
 * Get the available Google Groups map
 */
export function getAvailableGroups(): Record<string, string> {
  return { ...TUTOR_GROUPS };
}

/**
 * Resolve a group key to its email address
 */
export function resolveGroupEmail(groupKey: string): string | null {
  return TUTOR_GROUPS[groupKey] || null;
}
