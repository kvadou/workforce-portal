/**
 * TutorCruncher API Integration
 *
 * API Documentation: https://secure.tutorcruncher.com/api/
 * Used for managing contractor profiles and job assignments
 */

const TC_API_URL = process.env.TUTORCRUNCHER_API_BASE?.replace(/\/$/, "") || "https://secure.tutorcruncher.com/api";
const TC_API_TOKEN = process.env.TUTORCRUNCHER_API_TOKEN || "";

interface TCApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TCContractor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hourly_rate?: number;
  status: "approved" | "pending" | "suspended";
  created: string;
  updated: string;
}

interface CreateContractorParams {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hourlyRate?: number;
}

interface CreateContractorResult {
  success: boolean;
  contractorId?: number;
  error?: string;
}

/**
 * Make authenticated request to TutorCruncher API
 */
async function tcApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>
): Promise<TCApiResponse<T>> {
  if (!TC_API_TOKEN) {
    console.warn("TUTORCRUNCHER_API_TOKEN not set, skipping API call");
    return {
      success: false,
      error: "TutorCruncher API token not configured",
    };
  }

  try {
    const response = await fetch(`${TC_API_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Token ${TC_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TutorCruncher API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("TutorCruncher API request failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Create a new contractor in TutorCruncher
 */
export async function createTutorCruncherContractor(
  params: CreateContractorParams
): Promise<CreateContractorResult> {
  const result = await tcApiRequest<TCContractor>("/contractors/", "POST", {
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone: params.phone,
    default_rate: params.hourlyRate,
    status: "pending", // New contractors start as pending
  });

  if (result.success && result.data) {
    return {
      success: true,
      contractorId: result.data.id,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}

/**
 * Get contractor by ID
 */
export async function getTutorCruncherContractor(
  contractorId: number
): Promise<TCApiResponse<TCContractor>> {
  return tcApiRequest<TCContractor>(`/contractors/${contractorId}/`);
}

/**
 * Update contractor information
 */
export async function updateTutorCruncherContractor(
  contractorId: number,
  updates: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    hourlyRate: number;
    status: "approved" | "pending" | "suspended";
  }>
): Promise<TCApiResponse<TCContractor>> {
  const body: Record<string, unknown> = {};

  if (updates.firstName) body.first_name = updates.firstName;
  if (updates.lastName) body.last_name = updates.lastName;
  if (updates.email) body.email = updates.email;
  if (updates.phone) body.phone = updates.phone;
  if (updates.hourlyRate) body.default_rate = updates.hourlyRate;
  if (updates.status) body.status = updates.status;

  return tcApiRequest<TCContractor>(`/contractors/${contractorId}/`, "PUT", body);
}

/**
 * Approve a contractor (change status from pending to approved)
 */
export async function approveTutorCruncherContractor(
  contractorId: number
): Promise<TCApiResponse<TCContractor>> {
  return updateTutorCruncherContractor(contractorId, { status: "approved" });
}

/**
 * Suspend a contractor
 */
export async function suspendTutorCruncherContractor(
  contractorId: number
): Promise<TCApiResponse<TCContractor>> {
  return updateTutorCruncherContractor(contractorId, { status: "suspended" });
}

/**
 * Search for contractor by email
 */
export async function findTutorCruncherContractorByEmail(
  email: string
): Promise<TCApiResponse<TCContractor | null>> {
  const result = await tcApiRequest<{ results: TCContractor[] }>(
    `/contractors/?search=${encodeURIComponent(email)}`
  );

  if (result.success && result.data?.results && result.data.results.length > 0) {
    return { success: true, data: result.data.results[0] };
  }

  return { success: true, data: null };
}

/* ─── Types for extended TC data ─── */

export interface TCReview {
  id: number;
  rating: number;
  comments: string;
  reviewer: string;
  reviewer_id: number | null;
  created: string;
}

export interface TCPaymentOrder {
  id: number;
  date_sent: string;
  date_paid: string | null;
  amount: number;
  charges_count: number;
  status: string;
  url: string | null;
}

export interface TCPaymentCharge {
  id: number;
  payment_order_id: number;
  date: string;
  appointment_id: number | null;
  description: string;
  amount: number;
  rate: number | null;
  units: number | null;
}

/**
 * Get reviews for a contractor
 */
export async function getTutorCruncherContractorReviews(
  contractorId: number,
  limit: number = 50
): Promise<TCApiResponse<{ results: TCReview[] }>> {
  return tcApiRequest(`/contractors/${contractorId}/reviews/?page_size=${limit}`);
}

/**
 * Get payment orders for a contractor
 */
export async function getTutorCruncherPaymentOrders(
  contractorId: number,
  limit: number = 20
): Promise<TCApiResponse<{ results: TCPaymentOrder[] }>> {
  return tcApiRequest(`/payment_orders/?contractor=${contractorId}&page_size=${limit}`);
}

/**
 * Get payment order charges (line items)
 */
export async function getTutorCruncherPaymentCharges(
  paymentOrderId: number,
  limit: number = 50
): Promise<TCApiResponse<{ results: TCPaymentCharge[] }>> {
  return tcApiRequest(`/payment_orders/${paymentOrderId}/charges/?page_size=${limit}`);
}

/**
 * Get contractor's appointments/lessons with pagination
 */
export async function getTutorCruncherContractorAppointments(
  contractorId: number,
  limit: number = 100,
  offset: number = 0
): Promise<
  TCApiResponse<{
    results: Array<{
      id: number;
      start: string;
      finish: string;
      service: string;
      client: string;
      charge_rate: number;
      pay_rate: number;
    }>;
    count: number;
    next: string | null;
  }>
> {
  return tcApiRequest(`/contractors/${contractorId}/appointments/?page_size=${limit}&offset=${offset}`);
}
