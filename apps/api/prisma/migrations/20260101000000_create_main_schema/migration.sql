-- Migration: 20260101000000_create_main_schema
-- PHYZIQ Platform — Create full main database schema
-- Tables: gym_owners, gym_partners, members, adaptive_plans, plan_sessions,
--         exercises, workout_logs, food_items, meal_logs, coaches,
--         payment_transactions, payment_audit_log, coach_bookings,
--         consent_records, plan_exports, gym_challenges, challenge_enrolments,
--         gym_analytics_snapshots, compliance_events, plan_modification_log
-- Extensions: pgvector (vector)
-- Indexes: HNSW on exercises.embedding + food_items.embedding, all query indexes
-- Requirements: 1.2, 1.5, 2.1, 3.1, 4.1, 5.10, 6.5, 7.1, 9.4, 11.3, 12.1

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- GYM OWNERS
-- ---------------------------------------------------------------------------
CREATE TABLE gym_owners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number    TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    business_name   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- GYM PARTNERS
-- ---------------------------------------------------------------------------
CREATE TABLE gym_partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    location        TEXT NOT NULL,
    city            TEXT NOT NULL,
    qr_code_token   TEXT UNIQUE NOT NULL,
    equipment_list  JSONB NOT NULL DEFAULT '[]',
    owner_id        UUID REFERENCES gym_owners(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- MEMBERS
-- CHECK constraints: height 50–300, weight 20–500, sex enum
-- ---------------------------------------------------------------------------
CREATE TABLE members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number    TEXT UNIQUE NOT NULL,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    date_of_birth   DATE NOT NULL,
    sex             TEXT CHECK (sex IN ('male','female','other','prefer_not_to_say')),
    height_cm       NUMERIC(5,1) CHECK (height_cm BETWEEN 50 AND 300),
    weight_kg       NUMERIC(5,1) CHECK (weight_kg BETWEEN 20 AND 500),
    fitness_goal    TEXT NOT NULL,
    activity_level  TEXT NOT NULL,
    gym_id          UUID REFERENCES gym_partners(id),
    subscription_status TEXT DEFAULT 'free_preview',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- ADAPTIVE PLANS
-- CHECK constraint: plan_type enum
-- ---------------------------------------------------------------------------
CREATE TABLE adaptive_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    plan_type       TEXT CHECK (plan_type IN ('workout','nutrition','combined')),
    status          TEXT DEFAULT 'active',
    is_paid         BOOLEAN DEFAULT FALSE,
    week_number     INT NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    last_adapted_at TIMESTAMPTZ,
    plan_data       JSONB NOT NULL,
    confidence_avg  NUMERIC(4,1),
    version         INT DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- PLAN SESSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE plan_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES adaptive_plans(id),
    member_id       UUID NOT NULL REFERENCES members(id),
    scheduled_date  DATE NOT NULL,
    session_type    TEXT NOT NULL,
    status          TEXT DEFAULT 'scheduled',
    session_data    JSONB NOT NULL,
    adaptation_note TEXT
);

-- ---------------------------------------------------------------------------
-- EXERCISES (with pgvector embedding for similarity search)
-- ---------------------------------------------------------------------------
CREATE TABLE exercises (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    muscle_groups       TEXT[] NOT NULL,
    equipment_required  TEXT[],
    movement_pattern    TEXT,
    embedding           VECTOR(1536)
);

-- HNSW index for exercise similarity search (biomechanically equivalent swaps)
CREATE INDEX exercises_embedding_hnsw_idx ON exercises USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- WORKOUT LOGS
-- CHECK constraint: recovery_score 1–10
-- ---------------------------------------------------------------------------
CREATE TABLE workout_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    session_id      UUID REFERENCES plan_sessions(id),
    exercise_id     UUID REFERENCES exercises(id),
    logged_at       TIMESTAMPTZ DEFAULT NOW(),
    sets            JSONB NOT NULL,
    recovery_score  INT CHECK (recovery_score BETWEEN 1 AND 10),
    synced          BOOLEAN DEFAULT TRUE,
    offline_id      TEXT
);

-- ---------------------------------------------------------------------------
-- FOOD ITEMS (with pgvector embedding for similarity search)
-- ---------------------------------------------------------------------------
CREATE TABLE food_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    name_swahili        TEXT,
    calories_per_100g   NUMERIC(6,1),
    protein_g           NUMERIC(5,1),
    carbs_g             NUMERIC(5,1),
    fat_g               NUMERIC(5,1),
    fibre_g             NUMERIC(5,1),
    glycaemic_index     INT,
    sodium_mg           NUMERIC(7,1),
    is_local_kenyan     BOOLEAN DEFAULT FALSE,
    embedding           VECTOR(1536)
);

-- HNSW index for food item similarity search (meal recognition + NCD substitution)
CREATE INDEX food_items_embedding_hnsw_idx ON food_items USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- MEAL LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE meal_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    logged_at       TIMESTAMPTZ DEFAULT NOW(),
    meal_type       TEXT,
    food_items      JSONB NOT NULL,
    log_source      TEXT DEFAULT 'manual',
    photo_url       TEXT,
    confidence_avg  NUMERIC(4,1),
    corrections     JSONB,
    synced          BOOLEAN DEFAULT TRUE,
    offline_id      TEXT
);

-- ---------------------------------------------------------------------------
-- COACHES
-- ---------------------------------------------------------------------------
CREATE TABLE coaches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id           UUID UNIQUE REFERENCES members(id),
    specialisation      TEXT[],
    credentials         JSONB,
    is_verified         BOOLEAN DEFAULT FALSE,
    verification_doc_url TEXT,
    rating_avg          NUMERIC(3,1),
    session_fee_kes     NUMERIC(8,2),
    cancellation_policy JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- PAYMENT TRANSACTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE payment_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID REFERENCES members(id),
    coach_id        UUID REFERENCES coaches(id),
    amount_kes      NUMERIC(10,2) NOT NULL,
    currency        TEXT DEFAULT 'KES',
    payment_method  TEXT NOT NULL,
    payment_rail    TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    idempotency_key TEXT UNIQUE NOT NULL,
    gateway_ref     TEXT,
    gateway_amount  NUMERIC(10,2),
    initiated_at    TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at    TIMESTAMPTZ,
    plan_id         UUID REFERENCES adaptive_plans(id),
    transaction_type TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- PAYMENT AUDIT LOG (append-only, BIGSERIAL PK)
-- Enforced INSERT-only at application layer
-- ---------------------------------------------------------------------------
CREATE TABLE payment_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  UUID NOT NULL,
    event_type      TEXT NOT NULL,
    event_data      JSONB NOT NULL,
    gateway_ref     TEXT,
    utc_timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- Deny UPDATE and DELETE at database level for immutability
-- (Application-layer INSERT-only contract per design.md)
REVOKE UPDATE, DELETE ON payment_audit_log FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- COACH BOOKINGS
-- CHECK constraint: commission_pct 10–15
-- ---------------------------------------------------------------------------
CREATE TABLE coach_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    coach_id        UUID NOT NULL REFERENCES coaches(id),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    status          TEXT DEFAULT 'pending',
    session_fee_kes NUMERIC(8,2) NOT NULL,
    commission_pct  NUMERIC(4,2) NOT NULL CHECK (commission_pct BETWEEN 10 AND 15),
    escrow_released BOOLEAN DEFAULT FALSE,
    payment_id      UUID REFERENCES payment_transactions(id),
    cancellation_at TIMESTAMPTZ,
    review_submitted BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- CONSENT RECORDS
-- CHECK constraint: consent_type enum
-- ---------------------------------------------------------------------------
CREATE TABLE consent_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id),
    consent_type    TEXT NOT NULL CHECK (consent_type IN ('general', 'health_data', 'ai_training')),
    granted         BOOLEAN NOT NULL,
    granted_at      TIMESTAMPTZ DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,
    ip_address      INET,
    user_agent      TEXT
);

-- ---------------------------------------------------------------------------
-- PLAN EXPORTS
-- CHECK constraint: format enum
-- expires_at defaults to NOW() + 90 days
-- ---------------------------------------------------------------------------
CREATE TABLE plan_exports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id         UUID NOT NULL REFERENCES adaptive_plans(id),
    member_id       UUID NOT NULL REFERENCES members(id),
    format          TEXT NOT NULL CHECK (format IN ('pdf', 'docx')),
    s3_key          TEXT NOT NULL,
    file_size_bytes INT,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days',
    is_valid        BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- GYM CHALLENGES
-- ---------------------------------------------------------------------------
CREATE TABLE gym_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID NOT NULL REFERENCES gym_partners(id),
    name            TEXT NOT NULL,
    target_metric   TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- CHALLENGE ENROLMENTS (composite PK)
-- ---------------------------------------------------------------------------
CREATE TABLE challenge_enrolments (
    challenge_id    UUID NOT NULL REFERENCES gym_challenges(id),
    member_id       UUID NOT NULL REFERENCES members(id),
    consented       BOOLEAN NOT NULL,
    enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (challenge_id, member_id)
);

-- ---------------------------------------------------------------------------
-- GYM ANALYTICS SNAPSHOTS (pre-aggregated, populated by hourly cron)
-- at_risk_member_ids stores member UUIDs only — no PII or health data
-- ---------------------------------------------------------------------------
CREATE TABLE gym_analytics_snapshots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id                  UUID NOT NULL REFERENCES gym_partners(id),
    snapshot_at             TIMESTAMPTZ NOT NULL,
    total_active_members    INT,
    avg_plan_completion_pct NUMERIC(5,2),
    avg_weekly_sessions     NUMERIC(5,2),
    top_exercises           JSONB,
    session_heatmap         JSONB,
    at_risk_member_count    INT,
    at_risk_member_ids      UUID[]
);

-- Index for fast gym + time range dashboard queries
CREATE INDEX gym_analytics_snapshots_gym_time_idx
    ON gym_analytics_snapshots (gym_id, snapshot_at DESC);

-- ---------------------------------------------------------------------------
-- COMPLIANCE EVENTS (ODPC audit log, BIGSERIAL PK)
-- Tracks: consent_granted, consent_revoked, data_deleted, data_breach events
-- ---------------------------------------------------------------------------
CREATE TABLE compliance_events (
    id                  BIGSERIAL PRIMARY KEY,
    member_id           UUID REFERENCES members(id),
    event_type          TEXT NOT NULL,
    event_data          JSONB NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    reported_to_odpc_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- PLAN MODIFICATION LOG (AI Coach plan changes audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE plan_modification_log (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id           UUID NOT NULL REFERENCES adaptive_plans(id),
    member_id         UUID NOT NULL REFERENCES members(id),
    modification_type TEXT NOT NULL,
    triggered_by_query TEXT,
    modified_at       TIMESTAMPTZ DEFAULT NOW(),
    before_data       JSONB,
    after_data        JSONB
);

-- ---------------------------------------------------------------------------
-- Indexes for common query patterns
-- ---------------------------------------------------------------------------

-- Members: look up by phone (auth flow)
CREATE INDEX members_phone_idx ON members (phone_number);

-- Workout logs: time-ordered per member (dashboard queries, progressive overload)
CREATE INDEX workout_logs_member_logged_idx ON workout_logs (member_id, logged_at DESC);

-- Meal logs: time-ordered per member
CREATE INDEX meal_logs_member_logged_idx ON meal_logs (member_id, logged_at DESC);

-- Plan sessions: per plan, per member, by scheduled date
CREATE INDEX plan_sessions_plan_date_idx ON plan_sessions (plan_id, scheduled_date);
CREATE INDEX plan_sessions_member_date_idx ON plan_sessions (member_id, scheduled_date);

-- Adaptive plans: current active plan per member
CREATE INDEX adaptive_plans_member_status_idx ON adaptive_plans (member_id, status);

-- Payment transactions: per member (transaction history)
CREATE INDEX payment_transactions_member_idx ON payment_transactions (member_id, initiated_at DESC);

-- Payment audit log: per transaction (event timeline)
CREATE INDEX payment_audit_log_txn_idx ON payment_audit_log (transaction_id, utc_timestamp);

-- Consent records: per member and type (consent check queries)
CREATE INDEX consent_records_member_type_idx ON consent_records (member_id, consent_type);

-- Plan modification log: per plan (audit trail lookup)
CREATE INDEX plan_modification_log_plan_idx ON plan_modification_log (plan_id, modified_at DESC);

-- Compliance events: per member and event type
CREATE INDEX compliance_events_member_idx ON compliance_events (member_id, created_at DESC);
