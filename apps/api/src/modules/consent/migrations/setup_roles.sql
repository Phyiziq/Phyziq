-- ============================================================
-- Role Setup Script — Health_Data_Store & Main DB
-- Requirements: 1.7, 11.2
--
-- Run this script once against each database instance:
--   psql $HEALTH_DB_URL  -f setup_roles.sql
--   psql $DATABASE_URL   -f setup_roles.sql   (for app_svc grant only)
--
-- IMPORTANT: Replace <health_data_svc_password> and
--            <app_svc_password> with real secrets before
--            running in any environment.
-- ============================================================


-- ── Health DB roles (run against HEALTH_DB_URL) ─────────────

-- Create the role that is the ONLY role allowed to access health tables.
-- Used by: consent-module service account, ai-engine service account.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'health_data_svc') THEN
        CREATE ROLE health_data_svc LOGIN PASSWORD '<health_data_svc_password>';
    END IF;
END
$$;

-- Allow health_data_svc to connect to the health database
GRANT CONNECT ON DATABASE phyziq_health TO health_data_svc;

-- Grant DML on the three health tables
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ncd_profiles, biometric_logs
    TO health_data_svc;

-- Access log is append-only — INSERT only (no SELECT needed at role level)
GRANT INSERT
    ON health_data_access_log
    TO health_data_svc;

-- Allow health_data_svc to read the access log for internal audit queries
GRANT SELECT
    ON health_data_access_log
    TO health_data_svc;

-- Allow BIGSERIAL sequence usage on health_data_access_log.id
GRANT USAGE, SELECT
    ON SEQUENCE health_data_access_log_id_seq
    TO health_data_svc;


-- ── Main DB roles (run against DATABASE_URL) ─────────────────

-- Create the main application service role.
-- This role has NO access to any health tables — they live in a separate DB.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_svc') THEN
        CREATE ROLE app_svc LOGIN PASSWORD '<app_svc_password>';
    END IF;
END
$$;

-- Allow app_svc to connect to the main database
GRANT CONNECT ON DATABASE phyziq_main TO app_svc;

-- Grant app_svc access to main-DB tables (non-health)
-- Add explicit grants here as new tables are created.
-- Example (uncomment and extend as migrations run):
-- GRANT SELECT, INSERT, UPDATE, DELETE
--     ON members, gym_partners, gym_owners, adaptive_plans, plan_sessions,
--        workout_logs, meal_logs, food_items, exercises,
--        payment_transactions, payment_audit_log,
--        coaches, coach_bookings, consent_records, plan_exports,
--        gym_challenges, challenge_enrolments, gym_analytics_snapshots,
--        compliance_events, plan_modification_log
--     TO app_svc;

-- Explicitly confirm: app_svc has NO grants on health DB tables.
-- (They are in a separate database instance — no cross-DB grants possible.)
-- This comment documents intent; enforcement is structural (separate instance).

-- ── Revocation safeguard ─────────────────────────────────────
-- If any other role inadvertently has health table access, revoke it.
-- Run this on HEALTH_DB_URL only.
-- REVOKE ALL ON ncd_profiles, biometric_logs, health_data_access_log FROM PUBLIC;
