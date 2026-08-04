// ─── Enums ────────────────────────────────────────────────────────────────────

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type SubscriptionStatus = 'free_preview' | 'active' | 'cancelled' | 'expired';

export type PlanType = 'workout' | 'nutrition' | 'combined';

export type PlanStatus = 'active' | 'superseded' | 'archived';

export type SessionType = 'workout' | 'rest' | 'recovery';

export type SessionStatus = 'scheduled' | 'completed' | 'missed' | 'rebuilt';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type LogSource = 'manual' | 'photo' | 'voice';

export type PaymentMethod = 'mpesa' | 'card_ke' | 'pesalink' | 'card_intl';

export type PaymentRail = 'paystack' | 'stripe';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'timed_out';

export type TransactionType = 'one_time_plan' | 'subscription' | 'coach_booking';

export type CoachSpecialisation = 'personal_training' | 'dietetics' | 'physiotherapy';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type ConsentType = 'general' | 'health_data' | 'ai_training';

export type ExportFormat = 'pdf' | 'docx';

export type NcdRiskLevel = 'low' | 'moderate' | 'high' | 'diagnosed';

export type MovementPattern = 'push' | 'pull' | 'hinge' | 'squat' | 'carry';

export type ConfidenceSource = 'ai' | 'confirmed' | 'manual';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'offline';

export type AuditEventType = 'initiated' | 'callback_received' | 'status_update';

export type ComplianceEventType =
  | 'consent_granted'
  | 'consent_revoked'
  | 'data_deleted'
  | 'data_breach';

// ─── Core Domain Interfaces ───────────────────────────────────────────────────

export interface Member {
  id: string;
  phone_number: string; // E.164 format
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO 8601 date string
  sex: Sex;
  height_cm: number; // 50–300
  weight_kg: number; // 20–500
  fitness_goal: string;
  activity_level: string;
  gym_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface GymPartner {
  id: string;
  name: string;
  location: string;
  city: string;
  qr_code_token: string;
  equipment_list: string[]; // array of equipment slugs
  owner_id: string;
  is_active: boolean;
  created_at: string;
}

export interface GymOwner {
  id: string;
  phone_number: string;
  email: string;
  business_name: string;
  created_at: string;
}

export interface AdaptivePlan {
  id: string;
  member_id: string;
  plan_type: PlanType;
  status: PlanStatus;
  is_paid: boolean;
  week_number: number;
  generated_at: string;
  last_adapted_at: string | null;
  plan_data: PlanData;
  confidence_avg: number | null;
  version: number;
}

/** Structured content inside adaptive_plans.plan_data JSONB */
export interface PlanData {
  workout_sessions: WorkoutSessionData[];
  nutrition_days: NutritionDayData[];
  narrative: string;
}

export interface WorkoutSessionData {
  day: number; // 1–7
  session_type: SessionType;
  exercises: ExerciseSlot[];
}

export interface ExerciseSlot {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_seconds: number;
  rationale: string | null;
}

export interface NutritionDayData {
  day: number;
  meals: MealSlot[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface MealSlot {
  meal_type: MealType;
  food_items: FoodItemSlot[];
}

export interface FoodItemSlot {
  food_item_id: string;
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface PlanSession {
  id: string;
  plan_id: string;
  member_id: string;
  scheduled_date: string; // ISO 8601 date string
  session_type: SessionType;
  status: SessionStatus;
  session_data: WorkoutSessionData;
  adaptation_note: string | null;
}

export interface WorkoutSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_s: number | null;
}

export interface WorkoutLog {
  id: string;
  member_id: string;
  session_id: string | null;
  exercise_id: string | null;
  logged_at: string;
  sets: WorkoutSet[];
  recovery_score: number | null; // 1–10
  synced: boolean;
  offline_id: string | null;
}

export interface MealLogFoodItem {
  food_item_id: string;
  name: string;
  quantity_g: number;
  macros: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  confidence: number; // 0–100
}

export interface MealLog {
  id: string;
  member_id: string;
  logged_at: string;
  meal_type: MealType | null;
  food_items: MealLogFoodItem[];
  log_source: LogSource;
  photo_url: string | null;
  confidence_avg: number | null;
  corrections: MealLogFoodItem[] | null; // original AI estimate before correction
  synced: boolean;
  offline_id: string | null;
}

export interface FoodItem {
  id: string;
  name: string;
  name_swahili: string | null;
  calories_per_100g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  glycaemic_index: number | null;
  sodium_mg: number | null;
  is_local_kenyan: boolean;
  // embedding: number[]; — omitted from API responses; handled internally by pgvector
}

export interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment_required: string[];
  movement_pattern: MovementPattern | null;
  // embedding omitted — internal only
}

export interface PaymentTransaction {
  id: string;
  member_id: string | null;
  coach_id: string | null;
  amount_kes: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_rail: PaymentRail;
  status: PaymentStatus;
  idempotency_key: string;
  gateway_ref: string | null;
  gateway_amount: number | null; // amount confirmed by gateway callback
  initiated_at: string;
  confirmed_at: string | null;
  plan_id: string | null;
  transaction_type: TransactionType;
}

export interface CancellationPolicy {
  policy_type: string;
  refund_pct: number; // 0–100
  hours_threshold: number; // hours before session
}

export interface Coach {
  id: string;
  member_id: string | null;
  specialisation: CoachSpecialisation[];
  credentials: Record<string, unknown> | null;
  is_verified: boolean;
  verification_doc_url: string | null;
  rating_avg: number | null;
  session_fee_kes: number | null;
  cancellation_policy: CancellationPolicy | null;
  created_at: string;
}

export interface CoachBooking {
  id: string;
  member_id: string;
  coach_id: string;
  scheduled_at: string;
  status: BookingStatus;
  session_fee_kes: number;
  commission_pct: number; // 10–15
  escrow_released: boolean;
  payment_id: string | null;
  cancellation_at: string | null;
  review_submitted: boolean;
}

export interface ConsentRecord {
  id: string;
  member_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface PlanExport {
  id: string;
  plan_id: string;
  member_id: string;
  format: ExportFormat;
  s3_key: string;
  file_size_bytes: number | null;
  generated_at: string;
  expires_at: string;
  is_valid: boolean;
}

// ─── Health Data Store Types ───────────────────────────────────────────────────

export interface NcdProfile {
  id: string;
  member_id: string;
  diabetes_risk: NcdRiskLevel | null;
  hypertension_risk: NcdRiskLevel | null;
  cardiovascular_risk: NcdRiskLevel | null;
  medications: Record<string, unknown> | null; // encrypted at column level in DB
  last_updated: string;
  screening_version: number;
}

export interface BiometricLog {
  id: string;
  member_id: string;
  logged_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  resting_hr: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  notes: string | null;
}

// ─── AI / Confidence Types ─────────────────────────────────────────────────────

export interface ConfidenceIndicator {
  value: number; // 0–100
  source: ConfidenceSource;
  /** Display tier derived from value: high ≥80, estimated 40–79, low <40 */
  tier: 'high' | 'estimated' | 'low';
}

/** Compute the ConfidenceIndicator tier from a raw value */
export function computeConfidenceTier(value: number): ConfidenceIndicator['tier'] {
  if (value >= 80) return 'high';
  if (value >= 40) return 'estimated';
  return 'low';
}

// ─── Sync Types ────────────────────────────────────────────────────────────────

export interface SyncQueueEntry {
  offline_id: string;
  resource_type: 'workout_log' | 'meal_log';
  payload: WorkoutLog | MealLog;
  queued_at: string;
  retry_count: number;
}

export interface SyncConflict {
  offline_id: string;
  local_version: WorkoutLog | MealLog;
  server_version: WorkoutLog | MealLog;
  detected_at: string;
}

// ─── API Envelope Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    page_size?: number;
    total?: number;
    job_id?: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;       // e.g. "TOKEN_EXPIRED", "VALIDATION_ERROR", "AI_JOB_TIMEOUT"
    message: string;    // human-readable
    details?: unknown;  // zod errors, field-level details, etc.
  };
}

/** Union type for all API responses — use discriminated union on `success` field */
export type ApiResult<T> = ApiResponse<T> | ApiError;

// ─── Additional Supporting Types ───────────────────────────────────────────────

export interface GroceryListItem {
  food_item_id: string;
  name: string;
  category: string;
  estimated_quantity_g: number;
  estimated_cost_kes: number | null;
  low_cost_substitutes: Array<{
    food_item_id: string;
    name: string;
    estimated_cost_kes: number;
  }>;
}

export interface GroceryList {
  plan_id: string;
  week_number: number;
  generated_at: string;
  items: GroceryListItem[];
}

export interface ProgressiveOverloadRecommendation {
  exercise_id: string;
  recommended_weight_kg: number;
  recommended_reps: number;
  recommended_sets: number;
  confidence: ConfidenceIndicator;
}

export interface NcdConflictWarning {
  food_item_id: string;
  food_name: string;
  conflict_reason: string; // e.g. "High GI food for diabetes risk"
  recommended_alternative_id: string | null;
  recommended_alternative_name: string | null;
  confidence: ConfidenceIndicator;
}

export interface GymAnalyticsSnapshot {
  id: string;
  gym_id: string;
  snapshot_at: string;
  total_active_members: number;
  avg_plan_completion_pct: number;
  avg_weekly_sessions: number;
  top_exercises: Array<{ exercise_id: string; exercise_name: string; count: number }>;
  session_heatmap: Record<string, number>; // "day:hour" → count
  at_risk_member_count: number;
  at_risk_member_ids: string[]; // member IDs only, no health data
}
