-- Migration: 20260101000001_harden_audit_and_compliance_events
-- PHYZIQ Platform — Harden append-only audit tables and fix compliance_events schema
-- Changes:
--   payment_audit_log : add transaction_id index (Property 29)
--   compliance_events : recreate with event_type CHECK, occurred_at, reported_at,
--                       append-only REVOKE, and three targeted partial indexes
-- Requirements: 6.5, 11.5, 11.7

-- ---------------------------------------------------------------------------
-- PAYMENT AUDIT LOG — harden existing table (Req 6.5)
--
-- Adds the transaction-id index that was missing from task 2.1.
-- The REVOKE UPDATE/DELETE in the 0001 migration already enforces
-- the append-only constraint at DB level; this migration adds the
-- supporting index for Property 29 (payment audit log completeness).
--
-- APPEND-ONLY: Only insertPaymentAuditLog() in src/lib/audit.ts
-- may write to this table. No UPDATE or DELETE operations are permitted.
-- ---------------------------------------------------------------------------

-- Transaction index for fast lifecycle lookups (Property 29)
CREATE INDEX IF NOT EXISTS payment_audit_log_transaction_idx
    ON payment_audit_log (transaction_id, utc_timestamp);

-- ---------------------------------------------------------------------------
-- COMPLIANCE EVENTS — replace with spec-compliant definition (Req 11.5, 11.7)
--
-- The 0001_initial_schema migration created compliance_events with:
--   - event_type TEXT NOT NULL  (no CHECK constraint — non-compliant)
--   - event_data JSONB NOT NULL (no DEFAULT — non-compliant)
--   - created_at only           (missing occurred_at — non-compliant)
--   - reported_to_odpc_at       (wrong name — spec requires reported_at)
--
-- This migration recreates the table with the correct structure.
-- ---------------------------------------------------------------------------

-- Drop old table (no data in it yet at this migration point)
DROP TABLE IF EXISTS compliance_events;

-- Recreate compliance_events with full spec compliance
--
-- event_type CHECK: exactly these four values per Req 11.5 —
--   'consent_granted', 'consent_revoked', 'data_deleted', 'data_breach'
--
-- member_id:   NULL valid for breach events not tied to a single member (Req 11.7)
-- occurred_at: when the event happened (default NOW())
-- reported_at: for data_breach — when ODPC was notified (Req 11.7)
--              Kenya DPA 2019 requires ODPC notification within 72h of detection
-- event_data:  JSONB with DEFAULT '{}' (no null event payloads)
-- created_at:  record insertion timestamp (separate from occurred_at)
--
-- APPEND-ONLY: Only insertComplianceEvent() in src/lib/audit.ts
-- may write to this table. No UPDATE or DELETE operations are permitted.
CREATE TABLE compliance_events (
    id              BIGSERIAL PRIMARY KEY,
    member_id       UUID,           -- NULL for breach events not tied to one member
    event_type      TEXT NOT NULL CHECK (event_type IN (
                        'consent_granted',
                        'consent_revoked',
                        'data_deleted',
                        'data_breach'
                    )),
    event_data      JSONB NOT NULL DEFAULT '{}',
    occurred_at     TIMESTAMPTZ DEFAULT NOW(),
    reported_at     TIMESTAMPTZ,    -- for data_breach: when ODPC was notified (Req 11.7)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- FK to members (nullable — breach events may not be member-scoped)
ALTER TABLE compliance_events
    ADD CONSTRAINT compliance_events_member_fk
    FOREIGN KEY (member_id) REFERENCES members(id);

-- Deny UPDATE and DELETE to enforce append-only invariant at DB level
REVOKE UPDATE, DELETE ON compliance_events FROM PUBLIC;

-- Index for member-scoped compliance queries (consent/deletion workflows)
CREATE INDEX compliance_events_member_idx
    ON compliance_events (member_id, occurred_at DESC)
    WHERE member_id IS NOT NULL;

-- Index for breach event lookups (ODPC reporting workflow, Req 11.7)
CREATE INDEX compliance_events_type_idx
    ON compliance_events (event_type, occurred_at DESC);

-- Index for unreported breach events (monitoring: breach detected but not yet reported)
CREATE INDEX compliance_events_unreported_breach_idx
    ON compliance_events (occurred_at)
    WHERE event_type = 'data_breach' AND reported_at IS NULL;
