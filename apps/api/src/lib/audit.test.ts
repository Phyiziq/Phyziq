/**
 * audit.test.ts — Unit tests for the append-only audit helper layer
 *
 * Requirements: 6.5, 11.5, 11.7
 *
 * Tests verify:
 *  - Only CREATE operations are issued (no update / delete paths exist)
 *  - Input validation rejects invalid event types before hitting the DB
 *  - UUID validation rejects malformed identifiers
 *  - The correct data shape is passed to the database layer
 *  - Append-only invariant: the returned helper object exposes no update/delete
 */

import { describe, it, expect, vi } from "vitest";
import { createAuditHelpers } from "./audit.js";
import type {
  AuditPrismaClient,
  InsertPaymentAuditLogInput,
  InsertComplianceEventInput,
} from "./audit.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeMockClient(overrides: {
  paymentAuditLogCreate?: ReturnType<typeof vi.fn>;
  complianceEventCreate?: ReturnType<typeof vi.fn>;
} = {}): AuditPrismaClient {
  return {
    paymentAuditLog: {
      create:
        overrides.paymentAuditLogCreate ??
        vi.fn().mockResolvedValue({ id: BigInt(1) }),
    },
    complianceEvent: {
      create:
        overrides.complianceEventCreate ??
        vi.fn().mockResolvedValue({ id: BigInt(1) }),
    },
  };
}

// ---------------------------------------------------------------------------
// insertPaymentAuditLog
// ---------------------------------------------------------------------------

describe("insertPaymentAuditLog", () => {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("calls db.paymentAuditLog.create with correct data", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);

    const input: InsertPaymentAuditLogInput = {
      transactionId: VALID_UUID,
      eventType: "initiated",
      eventData: { amount: 450, currency: "KES" },
      gatewayRef: "pay_abc123",
    };

    const result = await insertPaymentAuditLog(input);

    expect(result.id).toBe(BigInt(1));
    expect(mock.paymentAuditLog.create).toHaveBeenCalledOnce();

    const callArg = (mock.paymentAuditLog.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.transactionId).toBe(VALID_UUID);
    expect(callArg.data.eventType).toBe("initiated");
    expect(callArg.data.eventData).toEqual({ amount: 450, currency: "KES" });
    expect(callArg.data.gatewayRef).toBe("pay_abc123");
    expect(callArg.select).toEqual({ id: true });
  });

  it("accepts all three valid event types", async () => {
    const validTypes = [
      "initiated",
      "callback_received",
      "status_update",
    ] as const;

    for (const eventType of validTypes) {
      const mock = makeMockClient();
      const { insertPaymentAuditLog } = createAuditHelpers(mock);
      await expect(
        insertPaymentAuditLog({ transactionId: VALID_UUID, eventType, eventData: {} })
      ).resolves.not.toThrow();
    }
  });

  it("rejects an invalid event type before calling the DB", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);

    await expect(
      insertPaymentAuditLog({
        transactionId: VALID_UUID,
        // @ts-expect-error intentional bad type
        eventType: "refunded",
        eventData: {},
      })
    ).rejects.toThrow(/Invalid payment event type/);

    expect(mock.paymentAuditLog.create).not.toHaveBeenCalled();
  });

  it("rejects a malformed transactionId UUID", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);

    await expect(
      insertPaymentAuditLog({
        transactionId: "not-a-uuid",
        eventType: "initiated",
        eventData: {},
      })
    ).rejects.toThrow(/Invalid UUID format/);

    expect(mock.paymentAuditLog.create).not.toHaveBeenCalled();
  });

  it("sets gatewayRef to null when omitted", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);

    await insertPaymentAuditLog({
      transactionId: VALID_UUID,
      eventType: "status_update",
      eventData: { status: "timed_out" },
    });

    const callArg = (mock.paymentAuditLog.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.gatewayRef).toBeNull();
  });

  it("passes explicit utcTimestamp when provided", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);
    const ts = new Date("2024-06-15T10:00:00Z");

    await insertPaymentAuditLog({
      transactionId: VALID_UUID,
      eventType: "callback_received",
      eventData: { gateway_status: "success" },
      utcTimestamp: ts,
    });

    const callArg = (mock.paymentAuditLog.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.utcTimestamp).toBe(ts);
  });

  it("does not include utcTimestamp in data when not provided (DB default applies)", async () => {
    const mock = makeMockClient();
    const { insertPaymentAuditLog } = createAuditHelpers(mock);

    await insertPaymentAuditLog({
      transactionId: VALID_UUID,
      eventType: "initiated",
      eventData: {},
    });

    const callArg = (mock.paymentAuditLog.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect("utcTimestamp" in callArg.data).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// insertComplianceEvent
// ---------------------------------------------------------------------------

describe("insertComplianceEvent", () => {
  const VALID_MEMBER_UUID = "660e8400-e29b-41d4-a716-446655440001";

  it("calls db.complianceEvent.create with correct data", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    const input: InsertComplianceEventInput = {
      memberId: VALID_MEMBER_UUID,
      eventType: "consent_granted",
      eventData: { consentType: "health_data" },
    };

    const result = await insertComplianceEvent(input);

    expect(result.id).toBe(BigInt(1));
    expect(mock.complianceEvent.create).toHaveBeenCalledOnce();

    const callArg = (mock.complianceEvent.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.memberId).toBe(VALID_MEMBER_UUID);
    expect(callArg.data.eventType).toBe("consent_granted");
    expect(callArg.data.eventData).toEqual({ consentType: "health_data" });
    expect(callArg.select).toEqual({ id: true });
  });

  it("accepts all four valid compliance event types", async () => {
    const validTypes = [
      "consent_granted",
      "consent_revoked",
      "data_deleted",
      "data_breach",
    ] as const;

    for (const eventType of validTypes) {
      const mock = makeMockClient();
      const { insertComplianceEvent } = createAuditHelpers(mock);
      await expect(
        insertComplianceEvent({ eventType })
      ).resolves.not.toThrow();
    }
  });

  it("rejects an event type outside the four permitted values", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await expect(
      insertComplianceEvent({
        memberId: VALID_MEMBER_UUID,
        // @ts-expect-error intentional bad type
        eventType: "odpc_registration_renewed",
      })
    ).rejects.toThrow(/Invalid compliance event type/);

    expect(mock.complianceEvent.create).not.toHaveBeenCalled();
  });

  it("accepts null memberId for breach events not tied to one member (Req 11.7)", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await expect(
      insertComplianceEvent({
        memberId: null,
        eventType: "data_breach",
        eventData: { scope: "all_members", detected_at: "2024-06-01T00:00:00Z" },
      })
    ).resolves.not.toThrow();

    const callArg = (mock.complianceEvent.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.memberId).toBeNull();
  });

  it("accepts undefined memberId (omitted)", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await expect(
      insertComplianceEvent({ eventType: "data_deleted" })
    ).resolves.not.toThrow();
  });

  it("rejects a malformed memberId UUID when provided", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await expect(
      insertComplianceEvent({
        memberId: "bad-uuid-format",
        eventType: "consent_revoked",
      })
    ).rejects.toThrow(/Invalid UUID format/);

    expect(mock.complianceEvent.create).not.toHaveBeenCalled();
  });

  it("sets reportedAt for data_breach ODPC notification (Req 11.7)", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);
    const reportedAt = new Date("2024-06-01T12:00:00Z");

    await insertComplianceEvent({
      eventType: "data_breach",
      eventData: { affected_count: 42 },
      reportedAt,
    });

    const callArg = (mock.complianceEvent.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.reportedAt).toBe(reportedAt);
  });

  it("sets reportedAt to null when not provided (breach detected but not yet reported)", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await insertComplianceEvent({
      eventType: "data_breach",
      eventData: { detected: true },
    });

    const callArg = (mock.complianceEvent.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.reportedAt).toBeNull();
  });

  it("defaults eventData to empty object when omitted", async () => {
    const mock = makeMockClient();
    const { insertComplianceEvent } = createAuditHelpers(mock);

    await insertComplianceEvent({ eventType: "consent_granted" });

    const callArg = (mock.complianceEvent.create as ReturnType<typeof vi.fn>)
      .mock.calls[0][0];
    expect(callArg.data.eventData).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Append-only surface area
// ---------------------------------------------------------------------------

describe("createAuditHelpers surface area", () => {
  it("exposes exactly insertPaymentAuditLog and insertComplianceEvent", () => {
    const helpers = createAuditHelpers(makeMockClient());
    const keys = Object.keys(helpers).sort();
    expect(keys).toEqual(["insertComplianceEvent", "insertPaymentAuditLog"]);
  });

  it("does NOT expose update or delete methods for payment_audit_log", () => {
    const helpers = createAuditHelpers(makeMockClient());
    expect("updatePaymentAuditLog" in helpers).toBe(false);
    expect("deletePaymentAuditLog" in helpers).toBe(false);
  });

  it("does NOT expose update or delete methods for compliance_events", () => {
    const helpers = createAuditHelpers(makeMockClient());
    expect("updateComplianceEvent" in helpers).toBe(false);
    expect("deleteComplianceEvent" in helpers).toBe(false);
  });
});
