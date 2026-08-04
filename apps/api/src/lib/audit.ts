/**
 * audit.ts — Append-only guard layer for audit tables
 *
 * Requirements: 6.5, 11.5, 11.7
 *
 * This module is the ONLY authorised write path for:
 *   - payment_audit_log    (Req 6.5 — immutable payment event trail)
 *   - compliance_events    (Req 11.5, 11.7 — ODPC compliance log)
 *
 * Both tables are APPEND-ONLY. No UPDATE or DELETE operations are exposed.
 * Any attempt to update or delete these records must be rejected at this layer.
 *
 * Payment audit event types: 'initiated' | 'callback_received' | 'status_update'
 * Compliance event types:    'consent_granted' | 'consent_revoked' |
 *                            'data_deleted'    | 'data_breach'
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * JSON-serialisable value (mirrors Prisma's InputJsonValue).
 * Defined locally so this module compiles before `prisma generate` runs.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Minimal interface for the Prisma client methods we need.
 * Using a structural interface keeps this module testable without
 * requiring a live database or a generated Prisma client.
 */
export interface AuditPrismaClient {
  paymentAuditLog: {
    create(args: {
      data: {
        transactionId: string;
        eventType: string;
        eventData: JsonValue | Record<string, unknown>;
        gatewayRef: string | null;
        utcTimestamp?: Date;
      };
      select: { id: true };
    }): Promise<{ id: bigint }>;
  };
  complianceEvent: {
    create(args: {
      data: {
        memberId: string | null;
        eventType: string;
        eventData: JsonValue | Record<string, unknown>;
        occurredAt?: Date;
        reportedAt: Date | null;
      };
      select: { id: true };
    }): Promise<{ id: bigint }>;
  };
}

/**
 * Valid payment lifecycle event types (Req 6.5).
 * Each STK Push transaction must produce exactly one entry per event type.
 */
export type PaymentEventType =
  | "initiated"
  | "callback_received"
  | "status_update";

/**
 * Valid compliance event types (Req 11.5, 11.7).
 * Matches the CHECK constraint in migration SQL.
 */
export type ComplianceEventType =
  | "consent_granted"
  | "consent_revoked"
  | "data_deleted"
  | "data_breach";

export interface InsertPaymentAuditLogInput {
  /** UUID of the payment_transactions record this event belongs to */
  transactionId: string;
  /** Lifecycle event type */
  eventType: PaymentEventType;
  /** Full event payload — gateway response body, status change details, etc. */
  eventData: JsonValue | Record<string, unknown>;
  /** Gateway-side reference (Paystack reference, Stripe charge id, etc.) */
  gatewayRef?: string | null;
  /**
   * UTC timestamp of the event. Defaults to NOW() at the database layer.
   * Pass explicitly when replaying events from a gateway callback timestamp.
   */
  utcTimestamp?: Date;
}

export interface InsertComplianceEventInput {
  /**
   * UUID of the affected member. NULL is valid for platform-wide data_breach
   * events not tied to a single member (Req 11.7).
   */
  memberId?: string | null;
  /** Compliance event type — must be one of the four permitted values */
  eventType: ComplianceEventType;
  /** Arbitrary JSONB payload — consent details, deletion confirmation, breach scope, etc. */
  eventData?: JsonValue | Record<string, unknown>;
  /** When the event actually occurred. Defaults to NOW(). */
  occurredAt?: Date;
  /**
   * For data_breach events: the UTC timestamp when the ODPC was notified.
   * The Kenya DPA 2019 requires notification within 72 hours of detection (Req 11.7).
   * Set this field when ODPC notification is sent, not at detection time.
   */
  reportedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Factory — accepts an injected client for testability
// ---------------------------------------------------------------------------

/**
 * Creates the audit helper bound to a specific Prisma-compatible client instance.
 * Pass the shared singleton in production; pass a mock/test client in tests.
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { createAuditHelpers } from './lib/audit.js';
 *
 * const prisma = new PrismaClient();
 * const { insertPaymentAuditLog, insertComplianceEvent } = createAuditHelpers(prisma);
 * ```
 */
export function createAuditHelpers(db: AuditPrismaClient) {
  /**
   * Append a payment lifecycle event to the immutable audit log (Req 6.5).
   *
   * This is the ONLY method that writes to `payment_audit_log`.
   * No update or delete path is exposed — append-only is the invariant.
   *
   * @throws if transactionId is not a valid UUID format
   * @throws if eventType is not one of the permitted values
   */
  async function insertPaymentAuditLog(
    input: InsertPaymentAuditLogInput
  ): Promise<{ id: bigint }> {
    validatePaymentEventType(input.eventType);
    validateUuid(input.transactionId, "transactionId");

    const record = await db.paymentAuditLog.create({
      data: {
        transactionId: input.transactionId,
        eventType: input.eventType,
        eventData: input.eventData,
        gatewayRef: input.gatewayRef ?? null,
        ...(input.utcTimestamp ? { utcTimestamp: input.utcTimestamp } : {}),
      },
      select: { id: true },
    });

    return { id: record.id };
  }

  /**
   * Append a compliance event to the ODPC audit log (Req 11.5, 11.7).
   *
   * This is the ONLY method that writes to `compliance_events`.
   * No update or delete path is exposed — append-only is the invariant.
   *
   * For data_breach events, set `reportedAt` when ODPC notification is sent.
   * Leaving `reportedAt` null after a breach is detected signals that the
   * 72-hour notification window (Kenya DPA 2019) has not yet been fulfilled.
   *
   * @throws if eventType is not one of the four permitted values
   * @throws if memberId is provided but is not a valid UUID format
   */
  async function insertComplianceEvent(
    input: InsertComplianceEventInput
  ): Promise<{ id: bigint }> {
    validateComplianceEventType(input.eventType);
    if (input.memberId != null) {
      validateUuid(input.memberId, "memberId");
    }

    const record = await db.complianceEvent.create({
      data: {
        memberId: input.memberId ?? null,
        eventType: input.eventType,
        eventData: input.eventData ?? {},
        ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
        reportedAt: input.reportedAt ?? null,
      },
      select: { id: true },
    });

    return { id: record.id };
  }

  return { insertPaymentAuditLog, insertComplianceEvent } as const;
}

// ---------------------------------------------------------------------------
// Default singleton helpers (convenience export for production use)
// ---------------------------------------------------------------------------

let _defaultClient: AuditPrismaClient | null = null;

/**
 * Returns the default audit client, lazily instantiated on first call.
 * In production this uses PrismaClient from @prisma/client.
 * Requires `prisma generate` to have been run.
 */
async function getDefaultClient(): Promise<AuditPrismaClient> {
  if (!_defaultClient) {
    // Lazy-import so this module can be loaded (and tested) without a generated client
    const { PrismaClient } = await import("@prisma/client");
    _defaultClient = new PrismaClient() as unknown as AuditPrismaClient;
  }
  return _defaultClient;
}

/**
 * Insert a payment audit log entry using the default singleton Prisma client.
 * Append-only — no update or delete paths are exposed (Req 6.5).
 *
 * Requires `prisma generate` to have been run before calling this function.
 */
export async function insertPaymentAuditLog(
  input: InsertPaymentAuditLogInput
): Promise<{ id: bigint }> {
  const client = await getDefaultClient();
  return createAuditHelpers(client).insertPaymentAuditLog(input);
}

/**
 * Insert a compliance event using the default singleton Prisma client.
 * Append-only — no update or delete paths are exposed (Req 11.5, 11.7).
 *
 * Requires `prisma generate` to have been run before calling this function.
 */
export async function insertComplianceEvent(
  input: InsertComplianceEventInput
): Promise<{ id: bigint }> {
  const client = await getDefaultClient();
  return createAuditHelpers(client).insertComplianceEvent(input);
}

// ---------------------------------------------------------------------------
// Internal validators
// ---------------------------------------------------------------------------

const PAYMENT_EVENT_TYPES = new Set<string>([
  "initiated",
  "callback_received",
  "status_update",
]);

const COMPLIANCE_EVENT_TYPES = new Set<string>([
  "consent_granted",
  "consent_revoked",
  "data_deleted",
  "data_breach",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validatePaymentEventType(eventType: string): void {
  if (!PAYMENT_EVENT_TYPES.has(eventType)) {
    throw new Error(
      `Invalid payment event type "${eventType}". ` +
        `Must be one of: ${[...PAYMENT_EVENT_TYPES].join(", ")}`
    );
  }
}

function validateComplianceEventType(eventType: string): void {
  if (!COMPLIANCE_EVENT_TYPES.has(eventType)) {
    throw new Error(
      `Invalid compliance event type "${eventType}". ` +
        `Must be one of: ${[...COMPLIANCE_EVENT_TYPES].join(", ")}`
    );
  }
}

function validateUuid(value: string, field: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(
      `Invalid UUID format for field "${field}": "${value}"`
    );
  }
}
