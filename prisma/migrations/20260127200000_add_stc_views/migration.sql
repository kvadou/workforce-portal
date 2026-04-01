-- STC Integration Views
-- These views provide read access to tutor data for the Acme Workforce (STC) application
--
-- IMPORTANT: This migration depends on the tutor_profiles, tutor_certifications, and User tables
-- Make sure those tables exist before running this migration

-- View: stc_contractors_view
-- Purpose: Provides contractor/tutor data in a format compatible with STC's expectations
-- Join User and TutorProfile to get complete tutor information
CREATE OR REPLACE VIEW stc_contractors_view AS
SELECT
  tp.id AS tutor_profile_id,
  u.id AS user_id,
  u.email,
  u.name,
  u.phone,
  u."avatarUrl" AS avatar_url,
  tp."tutorCruncherId" AS tutor_cruncher_id,
  tp."branchId" AS branch_id,
  tp."chessableUsername" AS chessable_username,
  tp.pronouns,
  tp.status,
  tp.team,
  tp."hireDate" AS hire_date,
  tp."activatedAt" AS activated_at,
  tp."terminatedAt" AS terminated_at,
  tp."isSchoolCertified" AS is_school_certified,
  tp."isBqCertified" AS is_bq_certified,
  tp."isPlaygroupCertified" AS is_playgroup_certified,
  tp."baseHourlyRate" AS base_hourly_rate,
  tp."chessLevel" AS chess_level,
  tp."chessRating" AS chess_rating,
  tp."noctieRating" AS noctie_rating,
  tp."chessableProgress" AS chessable_progress,
  tp."totalLessons" AS total_lessons,
  tp."totalHours" AS total_hours,
  tp."averageRating" AS average_rating,
  tp."lastLessonDate" AS last_lesson_date,
  o.name AS organization_name,
  o.subdomain AS organization_subdomain,
  tp."createdAt" AS created_at,
  tp."updatedAt" AS updated_at
FROM tutor_profiles tp
INNER JOIN "User" u ON tp."userId" = u.id
LEFT JOIN "Organization" o ON u."organizationId" = o.id
WHERE u.role IN ('TUTOR', 'LEAD_TUTOR', 'ONBOARDING_TUTOR');

-- View: stc_tutor_certifications_view
-- Purpose: Provides certification data for tutors
CREATE OR REPLACE VIEW stc_tutor_certifications_view AS
SELECT
  tc.id AS certification_id,
  tp.id AS tutor_profile_id,
  u.id AS user_id,
  u.email AS tutor_email,
  u.name AS tutor_name,
  tp."tutorCruncherId" AS tutor_cruncher_id,
  tc.type AS certification_type,
  tc.status AS certification_status,
  tc."earnedAt" AS earned_at,
  tc."expiresAt" AS expires_at,
  tc."verifiedBy" AS verified_by,
  tc."verifiedAt" AS verified_at,
  tc."documentUrl" AS document_url,
  tc.notes,
  tc."createdAt" AS created_at,
  tc."updatedAt" AS updated_at
FROM tutor_certifications tc
INNER JOIN tutor_profiles tp ON tc."tutorProfileId" = tp.id
INNER JOIN "User" u ON tp."userId" = u.id;

-- View: stc_active_tutors_view
-- Purpose: Quick access to currently active tutors only
CREATE OR REPLACE VIEW stc_active_tutors_view AS
SELECT * FROM stc_contractors_view
WHERE status = 'ACTIVE';

-- View: stc_tutor_summary_view
-- Purpose: Summary statistics for admin dashboards
CREATE OR REPLACE VIEW stc_tutor_summary_view AS
SELECT
  team,
  status,
  COUNT(*) AS tutor_count,
  AVG(total_lessons) AS avg_lessons,
  AVG(total_hours::numeric) AS avg_hours,
  AVG(average_rating::numeric) AS avg_rating
FROM stc_contractors_view
GROUP BY team, status;

-- Grant read access (adjust role names as needed for your STC setup)
-- GRANT SELECT ON stc_contractors_view TO stc_readonly;
-- GRANT SELECT ON stc_tutor_certifications_view TO stc_readonly;
-- GRANT SELECT ON stc_active_tutors_view TO stc_readonly;
-- GRANT SELECT ON stc_tutor_summary_view TO stc_readonly;
