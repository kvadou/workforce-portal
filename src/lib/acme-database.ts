import { Pool, QueryResult } from "pg";

/**
 * External Database Integration
 * Read-only connection to external production database
 * for pulling real tutor metrics (lessons, reviews, hours, etc.)
 */

// Singleton pool for Acme database connection
let acmePool: Pool | null = null;

// Cache for Acme metrics (1 hour TTL)
interface CachedMetrics {
  data: AcmeTutorMetrics;
  expiresAt: number;
}
const metricsCache = new Map<number, CachedMetrics>();
const METRICS_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

function getAcmePool(): Pool {
  if (!acmePool) {
    const connectionString = process.env.DATABASE_URL_STC;

    if (!connectionString) {
      throw new Error("DATABASE_URL_STC environment variable is not set");
    }

    acmePool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5, // Limit connections since this is read-only
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Log connection errors but don't crash
    acmePool.on("error", (err) => {
      console.error("Acme Database Pool Error:", err);
    });
  }

  return acmePool;
}

/**
 * Check if Acme database connection is configured
 */
export function isAcmeDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL_STC;
}

/**
 * Test the Acme database connection
 */
export async function testAcmeConnection(): Promise<boolean> {
  if (!isAcmeDatabaseConfigured()) {
    return false;
  }

  try {
    const pool = getAcmePool();
    const result = await pool.query("SELECT 1 as connected");
    return result.rows[0]?.connected === 1;
  } catch (error) {
    console.error("Acme Database connection test failed:", error);
    return false;
  }
}

// Types for Acme data
export interface AcmeContractor {
  contractor_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  review_rating: number | null;
  labels: string[];
  created_at: Date;
}

export interface AcmeTutorMetrics {
  totalLessons: number;
  totalHours: number;
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
  lessonsThisMonth: number;
  lessonsThisWeek: number;
}

export interface AcmeLesson {
  appointment_id: number;
  contractor_id: number;
  start_time: Date;
  end_time: Date;
  units: number;
  status: string;
  client_name: string;
  location_name: string | null;
}

export interface AcmeReview {
  review_id: number;
  contractor_id: number;
  star_rating_value: number;
  comment: string | null;
  created_at: Date;
  client_name: string;
}

/**
 * Get a contractor by email from Acme database
 */
export async function getContractorByEmail(email: string): Promise<AcmeContractor | null> {
  if (!isAcmeDatabaseConfigured()) {
    console.log("Acme database not configured, returning null");
    return null;
  }

  try {
    const pool = getAcmePool();
    const result: QueryResult<AcmeContractor> = await pool.query(
      `
      SELECT
        contractor_id,
        first_name,
        last_name,
        email,
        status,
        review_rating,
        labels,
        created_at
      FROM contractors
      WHERE LOWER(email) = LOWER($1)
        AND status = 'approved'
      LIMIT 1
      `,
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching contractor by email:", error);
    return null;
  }
}

/**
 * Get a contractor by ID from Acme database
 */
export async function getContractorById(contractorId: number): Promise<AcmeContractor | null> {
  if (!isAcmeDatabaseConfigured()) {
    return null;
  }

  try {
    const pool = getAcmePool();
    const result: QueryResult<AcmeContractor> = await pool.query(
      `
      SELECT
        contractor_id,
        first_name,
        last_name,
        email,
        status,
        review_rating,
        labels,
        created_at
      FROM contractors
      WHERE contractor_id = $1
      LIMIT 1
      `,
      [contractorId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching contractor by ID:", error);
    return null;
  }
}

/**
 * Get tutor performance metrics from Acme database
 * Aggregates lessons, hours, reviews, and ratings
 * Results are cached for 1 hour to reduce database load
 */
export async function getTutorMetrics(contractorId: number): Promise<AcmeTutorMetrics> {
  if (!isAcmeDatabaseConfigured()) {
    return getEmptyMetrics();
  }

  // Check cache first
  const cached = metricsCache.get(contractorId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const pool = getAcmePool();

    // Get lesson statistics
    const lessonsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_lessons,
        COALESCE(SUM(a.units), 0) as total_hours
      FROM appointments a
      JOIN appointment_contractors ac ON a.appointment_id = ac.appointment_id
      WHERE ac.contractor_id = $1
        AND a.status = 'completed'
        AND a.is_deleted = false
      `,
      [contractorId]
    );

    // Get lessons this month
    const monthResult = await pool.query(
      `
      SELECT COUNT(*) as lessons_this_month
      FROM appointments a
      JOIN appointment_contractors ac ON a.appointment_id = ac.appointment_id
      WHERE ac.contractor_id = $1
        AND a.status = 'completed'
        AND a.is_deleted = false
        AND a.start_time >= DATE_TRUNC('month', CURRENT_DATE)
      `,
      [contractorId]
    );

    // Get lessons this week
    const weekResult = await pool.query(
      `
      SELECT COUNT(*) as lessons_this_week
      FROM appointments a
      JOIN appointment_contractors ac ON a.appointment_id = ac.appointment_id
      WHERE ac.contractor_id = $1
        AND a.status = 'completed'
        AND a.is_deleted = false
        AND a.start_time >= DATE_TRUNC('week', CURRENT_DATE)
      `,
      [contractorId]
    );

    // Get review statistics
    const reviewsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total_reviews,
        COALESCE(AVG(star_rating_value), 0) as avg_rating,
        COUNT(*) FILTER (WHERE star_rating_value = 5) as five_star_count
      FROM reviews
      WHERE contractor_id = $1
      `,
      [contractorId]
    );

    const lessons = lessonsResult.rows[0];
    const month = monthResult.rows[0];
    const week = weekResult.rows[0];
    const reviews = reviewsResult.rows[0];

    const metrics: AcmeTutorMetrics = {
      totalLessons: parseInt(lessons?.total_lessons || "0", 10),
      totalHours: parseFloat(lessons?.total_hours || "0"),
      totalReviews: parseInt(reviews?.total_reviews || "0", 10),
      averageRating: parseFloat(reviews?.avg_rating || "0"),
      fiveStarCount: parseInt(reviews?.five_star_count || "0", 10),
      lessonsThisMonth: parseInt(month?.lessons_this_month || "0", 10),
      lessonsThisWeek: parseInt(week?.lessons_this_week || "0", 10),
    };

    // Cache the results
    metricsCache.set(contractorId, {
      data: metrics,
      expiresAt: Date.now() + METRICS_CACHE_TTL,
    });

    return metrics;
  } catch (error) {
    console.error("Error fetching tutor metrics:", error);
    return getEmptyMetrics();
  }
}

/**
 * Invalidate cached metrics for a contractor
 * Call this after updating tutor data
 */
export function invalidateMetricsCache(contractorId?: number): void {
  if (contractorId) {
    metricsCache.delete(contractorId);
  } else {
    metricsCache.clear();
  }
}

/**
 * Get recent lessons for a tutor
 */
export async function getRecentLessons(
  contractorId: number,
  limit: number = 10
): Promise<AcmeLesson[]> {
  if (!isAcmeDatabaseConfigured()) {
    return [];
  }

  try {
    const pool = getAcmePool();
    const result = await pool.query(
      `
      SELECT
        a.appointment_id,
        ac.contractor_id,
        a.start_time,
        a.end_time,
        a.units,
        a.status,
        c.first_name || ' ' || c.last_name as client_name,
        l.name as location_name
      FROM appointments a
      JOIN appointment_contractors ac ON a.appointment_id = ac.appointment_id
      LEFT JOIN clients c ON a.client_id = c.client_id
      LEFT JOIN locations l ON a.location_id = l.location_id
      WHERE ac.contractor_id = $1
        AND a.is_deleted = false
      ORDER BY a.start_time DESC
      LIMIT $2
      `,
      [contractorId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching recent lessons:", error);
    return [];
  }
}

/**
 * Get recent reviews for a tutor
 */
export async function getRecentReviews(
  contractorId: number,
  limit: number = 5
): Promise<AcmeReview[]> {
  if (!isAcmeDatabaseConfigured()) {
    return [];
  }

  try {
    const pool = getAcmePool();
    const result = await pool.query(
      `
      SELECT
        r.review_id,
        r.contractor_id,
        r.star_rating_value,
        r.comment,
        r.created_at,
        c.first_name || ' ' || c.last_name as client_name
      FROM reviews r
      LEFT JOIN clients c ON r.client_id = c.client_id
      WHERE r.contractor_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
      `,
      [contractorId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return [];
  }
}

/**
 * Get all approved contractors (for sync)
 */
export async function getAllApprovedContractors(): Promise<AcmeContractor[]> {
  if (!isAcmeDatabaseConfigured()) {
    return [];
  }

  try {
    const pool = getAcmePool();
    const result: QueryResult<AcmeContractor> = await pool.query(
      `
      SELECT
        contractor_id,
        first_name,
        last_name,
        email,
        status,
        review_rating,
        labels,
        created_at
      FROM contractors
      WHERE status = 'approved'
      ORDER BY contractor_id
      `
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching all approved contractors:", error);
    return [];
  }
}

/**
 * Get contractors added since a specific date (for incremental sync)
 */
export async function getNewContractorsSince(since: Date): Promise<AcmeContractor[]> {
  if (!isAcmeDatabaseConfigured()) {
    return [];
  }

  try {
    const pool = getAcmePool();
    const result: QueryResult<AcmeContractor> = await pool.query(
      `
      SELECT
        contractor_id,
        first_name,
        last_name,
        email,
        status,
        review_rating,
        labels,
        created_at
      FROM contractors
      WHERE status = 'approved'
        AND created_at > $1
      ORDER BY created_at DESC
      `,
      [since]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching new contractors:", error);
    return [];
  }
}

/**
 * Get leaderboard data directly from Acme
 * (Can be used for comparison or as fallback)
 */
export async function getAcmeLeaderboard(
  limit: number = 10,
  period: "all" | "month" | "week" = "month"
): Promise<{
  contractorId: number;
  name: string;
  email: string;
  totalLessons: number;
  totalHours: number;
  averageRating: number;
}[]> {
  if (!isAcmeDatabaseConfigured()) {
    return [];
  }

  let dateFilter = "";
  if (period === "month") {
    dateFilter = "AND a.start_time >= DATE_TRUNC('month', CURRENT_DATE)";
  } else if (period === "week") {
    dateFilter = "AND a.start_time >= DATE_TRUNC('week', CURRENT_DATE)";
  }

  try {
    const pool = getAcmePool();
    const result = await pool.query(
      `
      SELECT
        c.contractor_id,
        c.first_name || ' ' || c.last_name as name,
        c.email,
        COUNT(DISTINCT a.appointment_id) as total_lessons,
        COALESCE(SUM(a.units), 0) as total_hours,
        COALESCE(c.review_rating, 0) as average_rating
      FROM contractors c
      LEFT JOIN appointment_contractors ac ON c.contractor_id = ac.contractor_id
      LEFT JOIN appointments a ON ac.appointment_id = a.appointment_id
        AND a.status = 'completed'
        AND a.is_deleted = false
        ${dateFilter}
      WHERE c.status = 'approved'
      GROUP BY c.contractor_id, c.first_name, c.last_name, c.email, c.review_rating
      ORDER BY total_lessons DESC, total_hours DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map((row) => ({
      contractorId: row.contractor_id,
      name: row.name,
      email: row.email,
      totalLessons: parseInt(row.total_lessons, 10),
      totalHours: parseFloat(row.total_hours),
      averageRating: parseFloat(row.average_rating),
    }));
  } catch (error) {
    console.error("Error fetching Acme leaderboard:", error);
    return [];
  }
}

/**
 * Helper: Return empty metrics object
 */
function getEmptyMetrics(): AcmeTutorMetrics {
  return {
    totalLessons: 0,
    totalHours: 0,
    totalReviews: 0,
    averageRating: 0,
    fiveStarCount: 0,
    lessonsThisMonth: 0,
    lessonsThisWeek: 0,
  };
}

/**
 * Close the Acme database pool (for cleanup)
 */
export async function closeAcmePool(): Promise<void> {
  if (acmePool) {
    await acmePool.end();
    acmePool = null;
  }
}

// Convenience export for sync operations
export const acmeDatabase = {
  isConfigured: isAcmeDatabaseConfigured,
  testConnection: testAcmeConnection,
  getContractorByEmail,
  getContractorById,
  getTutorMetrics,
  getRecentLessons,
  getRecentReviews,
  getApprovedContractors: getAllApprovedContractors,
  getNewContractorsSince,
  getLeaderboard: getAcmeLeaderboard,
  invalidateCache: invalidateMetricsCache,
  close: closeAcmePool,
};
