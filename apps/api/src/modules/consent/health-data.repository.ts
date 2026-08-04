/**
 * HealthDataRepository
 *
 * Single access gateway to the Health_Data_Store (separate PostgreSQL instance).
 * ALL health data access — reads, writes, and deletes — must go through this
 * class. No other module may import the health DB pool directly.
 *
 * Every public method calls `this.logAccess()` internally before returning to
 * ensure that every operation is captured in `health_data_access_log`.
 *
 * Requirements: 1.7, 11.2, 11.6
 */

import type pg from 'pg';
import type { NcdProfile, BiometricLog } from '@phyziq/shared';
import { getHealthPool } from './health-db.js';

// ── Row types returned by the DB (snake_case, matching column names) ─────────

interface NcdProfileRow {
  id: string;
  member_id: string;
  diabetes_risk: string | null;
  hypertension_risk: string | null;
  cardiovascular_risk: string | null;
  medications: Record<string, unknown> | null;
  last_updated: Date;
  screening_version: number;
}

interface BiometricLogRow {
  id: string;
  member_id: string;
  logged_at: Date;
  weight_kg: string | null;
  body_fat_pct: string | null;
  resting_hr: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  notes: string | null;
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function rowToNcdProfile(row: NcdProfileRow): NcdProfile {
  return {
    id: row.id,
    member_id: row.member_id,
    diabetes_risk: (row.diabetes_risk as NcdProfile['diabetes_risk']) ?? null,
    hypertension_risk: (row.hypertension_risk as NcdProfile['hypertension_risk']) ?? null,
    cardiovascular_risk: (row.cardiovascular_risk as NcdProfile['cardiovascular_risk']) ?? null,
    medications: row.medications,
    last_updated: row.last_updated.toISOString(),
    screening_version: row.screening_version,
  };
}

function rowToBiometricLog(row: BiometricLogRow): BiometricLog {
  return {
    id: row.id,
    member_id: row.member_id,
    logged_at: row.logged_at.toISOString(),
    weight_kg: row.weight_kg != null ? parseFloat(row.weight_kg) : null,
    body_fat_pct: row.body_fat_pct != null ? parseFloat(row.body_fat_pct) : null,
    resting_hr: row.resting_hr,
    blood_pressure_systolic: row.blood_pressure_systolic,
    blood_pressure_diastolic: row.blood_pressure_diastolic,
    notes: row.notes,
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

export class HealthDataRepository {
  private readonly pool: pg.Pool;

  constructor(pool?: pg.Pool) {
    // Allow injecting a pool for testing; default to the singleton
    this.pool = pool ?? getHealthPool();
  }

  // ── NCD Profiles ────────────────────────────────────────────────────────

  /**
   * Fetch a member's NCD profile, or null if it doesn't exist yet.
   * Logs a READ access event before returning.
   */
  async findNcdProfile(
    memberId: string,
    accessingService: string = 'consent-module',
    requestContext?: string
  ): Promise<NcdProfile | null> {
    const result = await this.pool.query<NcdProfileRow>(
      `SELECT id, member_id, diabetes_risk, hypertension_risk, cardiovascular_risk,
              medications, last_updated, screening_version
         FROM ncd_profiles
        WHERE member_id = $1`,
      [memberId]
    );

    await this.logAccess(memberId, 'READ', accessingService, requestContext);

    if (result.rows.length === 0) {
      return null;
    }

    return rowToNcdProfile(result.rows[0] as NcdProfileRow);
  }

  /**
   * Insert or update a member's NCD profile.
   * Logs a WRITE access event before returning.
   */
  async upsertNcdProfile(
    memberId: string,
    data: Partial<Omit<NcdProfile, 'id' | 'member_id' | 'last_updated'>>,
    accessingService: string = 'consent-module',
    requestContext?: string
  ): Promise<NcdProfile> {
    const {
      diabetes_risk = null,
      hypertension_risk = null,
      cardiovascular_risk = null,
      medications = null,
      screening_version = 1,
    } = data;

    const result = await this.pool.query<NcdProfileRow>(
      `INSERT INTO ncd_profiles
         (member_id, diabetes_risk, hypertension_risk, cardiovascular_risk,
          medications, last_updated, screening_version)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (member_id)
       DO UPDATE SET
         diabetes_risk       = EXCLUDED.diabetes_risk,
         hypertension_risk   = EXCLUDED.hypertension_risk,
         cardiovascular_risk = EXCLUDED.cardiovascular_risk,
         medications         = EXCLUDED.medications,
         last_updated        = NOW(),
         screening_version   = EXCLUDED.screening_version
       RETURNING id, member_id, diabetes_risk, hypertension_risk,
                 cardiovascular_risk, medications, last_updated, screening_version`,
      [memberId, diabetes_risk, hypertension_risk, cardiovascular_risk,
       medications ? JSON.stringify(medications) : null, screening_version]
    );

    await this.logAccess(memberId, 'WRITE', accessingService, requestContext);

    const row = result.rows[0];
    if (!row) {
      throw new Error(`upsertNcdProfile: unexpected empty result for member ${memberId}`);
    }

    return rowToNcdProfile(row as NcdProfileRow);
  }

  // ── Biometric Logs ───────────────────────────────────────────────────────

  /**
   * Insert a new biometric log entry.
   * Logs a WRITE access event before returning.
   */
  async insertBiometricLog(
    memberId: string,
    data: Omit<BiometricLog, 'id' | 'member_id' | 'logged_at'>,
    accessingService: string = 'consent-module',
    requestContext?: string
  ): Promise<BiometricLog> {
    const {
      weight_kg,
      body_fat_pct,
      resting_hr,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      notes,
    } = data;

    const result = await this.pool.query<BiometricLogRow>(
      `INSERT INTO biometric_logs
         (member_id, logged_at, weight_kg, body_fat_pct, resting_hr,
          blood_pressure_systolic, blood_pressure_diastolic, notes)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
       RETURNING id, member_id, logged_at, weight_kg, body_fat_pct, resting_hr,
                 blood_pressure_systolic, blood_pressure_diastolic, notes`,
      [memberId, weight_kg, body_fat_pct, resting_hr,
       blood_pressure_systolic, blood_pressure_diastolic, notes ?? null]
    );

    await this.logAccess(memberId, 'WRITE', accessingService, requestContext);

    const row = result.rows[0];
    if (!row) {
      throw new Error(`insertBiometricLog: unexpected empty result for member ${memberId}`);
    }

    return rowToBiometricLog(row as BiometricLogRow);
  }

  // ── Deletion ─────────────────────────────────────────────────────────────

  /**
   * Delete all health data for a member (NCD profile + all biometric logs).
   * Used during consent withdrawal. Logs a DELETE access event before returning.
   *
   * Requirements: 11.4
   */
  async deleteAllHealthData(
    memberId: string,
    accessingService: string = 'consent-module',
    requestContext?: string
  ): Promise<void> {
    // Use a transaction to ensure both deletions succeed or both roll back
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM ncd_profiles WHERE member_id = $1', [memberId]);
      await client.query('DELETE FROM biometric_logs WHERE member_id = $1', [memberId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await this.logAccess(memberId, 'DELETE', accessingService, requestContext);
  }

  // ── Access Audit Log ─────────────────────────────────────────────────────

  /**
   * Insert a row into `health_data_access_log`.
   *
   * Called internally by every other method before returning. Can also be
   * called directly when an access needs to be recorded without a corresponding
   * data operation (e.g., a failed read attempt).
   *
   * Requirements: 11.6
   */
  async logAccess(
    memberId: string,
    operation: 'READ' | 'WRITE' | 'DELETE',
    accessingService: string,
    requestContext?: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO health_data_access_log
         (accessed_at, member_id, accessing_service, operation_type, request_context)
       VALUES (NOW(), $1, $2, $3, $4)`,
      [memberId, accessingService, operation, requestContext ?? null]
    );
  }
}
