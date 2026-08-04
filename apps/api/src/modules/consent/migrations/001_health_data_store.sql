-- ============================================================
-- Health_Data_Store — Initial Schema Migration
-- Applies to: separate PostgreSQL instance (HEALTH_DB_URL)
-- Requirements: 1.7, 11.2
-- ============================================================

-- NCD Profiles
-- Stores non-communicable disease risk data for members.
-- member_id is a logical FK only — no cross-database constraint.
CREATE TABLE IF NOT EXISTS ncd_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id           UUID UNIQUE NOT NULL,
    diabetes_risk       TEXT,
    hypertension_risk   TEXT,
    cardiovascular_risk TEXT,
    medications         JSONB,          -- encrypted at column level
    last_updated        TIMESTAMPTZ DEFAULT NOW(),
    screening_version   INT DEFAULT 1
);

-- Biometric Logs
-- Time-series biometric measurements per member.
CREATE TABLE IF NOT EXISTS biometric_logs (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id                UUID NOT NULL,
    logged_at                TIMESTAMPTZ DEFAULT NOW(),
    weight_kg                NUMERIC(5,1),
    body_fat_pct             NUMERIC(4,1),
    resting_hr               INT,
    blood_pressure_systolic  INT,
    blood_pressure_diastolic INT,
    notes                    TEXT
);

-- Health Data Access Audit Log
-- Every read or write operation on this database must produce a row here.
-- Append-only — no UPDATEs or DELETEs on this table.
CREATE TABLE IF NOT EXISTS health_data_access_log (
    id                BIGSERIAL PRIMARY KEY,
    accessed_at       TIMESTAMPTZ DEFAULT NOW(),
    member_id         UUID NOT NULL,
    accessing_service TEXT NOT NULL,   -- e.g. "consent-module", "ai-engine"
    operation_type    TEXT NOT NULL    -- READ, WRITE, DELETE
        CHECK (operation_type IN ('READ', 'WRITE', 'DELETE')),
    request_context   TEXT             -- job_id or session_id for traceability
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ncd_profiles_member_id
    ON ncd_profiles (member_id);

CREATE INDEX IF NOT EXISTS idx_biometric_logs_member_id_logged_at
    ON biometric_logs (member_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_access_log_member_id
    ON health_data_access_log (member_id);

CREATE INDEX IF NOT EXISTS idx_health_access_log_accessed_at
    ON health_data_access_log (accessed_at DESC);
