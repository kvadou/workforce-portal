/**
 * Branch API Integration
 *
 * Branch is used for payment processing and contractor payments.
 * This integration creates payment profiles for new tutors.
 */

const BRANCH_API_URL = process.env.BRANCH_API_URL || "https://api.branchapp.com/v1";
const BRANCH_API_KEY = process.env.BRANCH_API_KEY || "";
const BRANCH_ORGANIZATION_ID = process.env.BRANCH_ORGANIZATION_ID || "";

interface BranchApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BranchPaymentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: "active" | "pending" | "inactive";
  createdAt: string;
}

interface CreatePaymentProfileParams {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface CreatePaymentProfileResult {
  success: boolean;
  profileId?: string;
  error?: string;
}

/**
 * Make authenticated request to Branch API
 */
async function branchApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<BranchApiResponse<T>> {
  if (!BRANCH_API_KEY) {
    console.warn("BRANCH_API_KEY not set, skipping API call");
    return {
      success: false,
      error: "Branch API key not configured",
    };
  }

  try {
    const response = await fetch(`${BRANCH_API_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${BRANCH_API_KEY}`,
        "Content-Type": "application/json",
        "X-Organization-Id": BRANCH_ORGANIZATION_ID,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Branch API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Branch API request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Create a payment profile for a new contractor
 */
export async function createBranchPaymentProfile(
  params: CreatePaymentProfileParams
): Promise<CreatePaymentProfileResult> {
  const result = await branchApiRequest<BranchPaymentProfile>("/workers", "POST", {
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    phone: params.phone,
    type: "contractor",
    send_invite: true, // Send Branch invite to set up their account
  });

  if (result.success && result.data) {
    return {
      success: true,
      profileId: result.data.id,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}

/**
 * Get payment profile by ID
 */
export async function getBranchPaymentProfile(
  profileId: string
): Promise<BranchApiResponse<BranchPaymentProfile>> {
  return branchApiRequest<BranchPaymentProfile>(`/workers/${profileId}`);
}

/**
 * Update payment profile
 */
export async function updateBranchPaymentProfile(
  profileId: string,
  updates: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: "active" | "inactive";
  }>
): Promise<BranchApiResponse<BranchPaymentProfile>> {
  const body: Record<string, unknown> = {};

  if (updates.email) body.email = updates.email;
  if (updates.firstName) body.first_name = updates.firstName;
  if (updates.lastName) body.last_name = updates.lastName;
  if (updates.phone) body.phone = updates.phone;
  if (updates.status) body.status = updates.status;

  return branchApiRequest<BranchPaymentProfile>(`/workers/${profileId}`, "PUT", body);
}

/**
 * Deactivate payment profile
 */
export async function deactivateBranchPaymentProfile(
  profileId: string
): Promise<BranchApiResponse<BranchPaymentProfile>> {
  return updateBranchPaymentProfile(profileId, { status: "inactive" });
}

/**
 * Find payment profile by email
 */
export async function findBranchPaymentProfileByEmail(
  email: string
): Promise<BranchApiResponse<BranchPaymentProfile | null>> {
  const result = await branchApiRequest<{ workers: BranchPaymentProfile[] }>(
    `/workers?email=${encodeURIComponent(email)}`
  );

  if (result.success && result.data?.workers && result.data.workers.length > 0) {
    return { success: true, data: result.data.workers[0] };
  }

  return { success: true, data: null };
}

/**
 * Get payment history for a worker
 */
export async function getBranchPaymentHistory(
  profileId: string,
  options?: { limit?: number; startDate?: string; endDate?: string }
): Promise<
  BranchApiResponse<
    Array<{
      id: string;
      amount: number;
      status: string;
      paidAt: string;
      description: string;
    }>
  >
> {
  const params = new URLSearchParams();
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.startDate) params.append("start_date", options.startDate);
  if (options?.endDate) params.append("end_date", options.endDate);

  const queryString = params.toString();
  const endpoint = `/workers/${profileId}/payments${queryString ? `?${queryString}` : ""}`;

  return branchApiRequest(endpoint);
}
