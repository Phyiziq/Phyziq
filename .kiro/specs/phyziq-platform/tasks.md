# Implementation Plan: PHYZIQ AI Fitness Platform

## Overview

This plan implements the PHYZIQ platform end-to-end using a TypeScript monorepo (pnpm + Turborepo). The build sequence follows strict dependency order: monorepo scaffolding and shared types → database schemas → authentication → health data isolation → AI orchestration → core member flows → payments → gym owner dashboard → coach marketplace → plan export → offline sync → compliance → CI/CD. Every task references the requirements and design sections it satisfies.

## Tasks

- [x] 1. Scaffold monorepo, tooling, and shared type package
  - [x] 1.1 Initialise pnpm workspace with Turborepo and create `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`, `packages/ui`, `packages/ai-engine` directory structure
    - Configure `turbo.json` with `build`, `test`, `lint`, `type-check` pipelines
    - Add root `package.json` with pnpm workspace glob
    - _Requirements: all (foundational)_

  - [x] 1.2 Define all shared TypeScript types in `packages/shared`
    - Export interfaces: `Member`, `GymPartner`, `GymOwner`, `AdaptivePlan`, `PlanSession`, `WorkoutLog`, `MealLog`, `FoodItem`, `Exercise`, `PaymentTransaction`, `Coach`, `CoachBooking`, `ConsentRecord`, `PlanExport`, `NcdProfile`, `BiometricLog`, `SyncStatus`, `ConfidenceIndicator`
    - Export API response envelope type `ApiResponse<T>` and error type `ApiError`
    - _Requirements: 1–12 (used by all modules)_

  - [ ]* 1.3 Write property test: registration validation completeness
    - **Property 2: Registration Validation Completeness**
    - **Validates: Requirements 1.2, 1.5**


- [x] 2. Database schema — main database (PostgreSQL 16)
  - [x] 2.1 Write and apply Prisma migrations for all main DB tables
    - Tables: `members`, `gym_partners`, `gym_owners`, `adaptive_plans`, `plan_sessions`, `workout_logs`, `meal_logs`, `food_items`, `exercises`, `payment_transactions`, `payment_audit_log`, `coaches`, `coach_bookings`, `consent_records`, `plan_exports`, `gym_challenges`, `challenge_enrolments`, `gym_analytics_snapshots`, `compliance_events`, `plan_modification_log`
    - Enable `pgvector` extension; add HNSW indexes on `food_items.embedding` and `exercises.embedding`
    - Add `CHECK` constraints matching design schema (height 50–300, weight 20–500, commission_pct 10–15, sex enum, format enum, consent_type enum)
    - _Requirements: 1.2, 1.5, 2.1, 3.1, 4.1, 5.10, 6.5, 7.1, 9.4, 11.3, 12.1_

  - [x] 2.2 Write and apply migrations for payment audit log and compliance events tables
    - `payment_audit_log`: append-only enforced at app layer (INSERT only, no UPDATE)
    - `compliance_events`: tracks consent_granted, consent_revoked, data_deleted, data_breach events
    - _Requirements: 6.5, 11.5, 11.7_

  - [ ]* 2.3 Write property test: payment audit log completeness
    - **Property 29: Payment Audit Log Completeness**
    - **Validates: Requirements 6.5**


- [x] 3. Database schema — Health_Data_Store (isolated PostgreSQL instance)
  - [x] 3.1 Provision separate PostgreSQL instance and apply Health_Data_Store migrations
    - Tables: `ncd_profiles`, `biometric_logs`, `health_data_access_log`
    - Create `health_data_svc` PostgreSQL role with `CONNECT`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` on health tables only
    - Create `app_svc` role for main DB with no access to health tables
    - Configure separate connection string in environment secrets
    - _Requirements: 1.7, 11.2_

  - [x] 3.2 Implement `HealthDataRepository` class in `apps/api/src/modules/consent`
    - All health DB access must go through this class; enforce via ESLint `import/no-restricted-paths` rule
    - Methods: `findNcdProfile`, `upsertNcdProfile`, `insertBiometricLog`, `deleteAllHealthData`, `logAccess`
    - Every method calls `logAccess()` internally before returning
    - _Requirements: 1.7, 11.2, 11.6_

  - [ ]* 3.3 Write property test: health data routing invariant
    - **Property 3: Health Data Routing Invariant**
    - **Validates: Requirements 1.7, 11.2**

  - [ ]* 3.4 Write property test: health data access audit coverage
    - **Property 44: Health Data Access Audit Coverage**
    - **Validates: Requirements 11.6**


- [-] 4. API foundation — Express app, middleware, and Zod validation
  - [ ] 4.1 Bootstrap `apps/api` Express application with TypeScript
    - Configure `zod` request validation middleware applied globally before all route handlers
    - Configure `compression` middleware (gzip + Brotli, threshold 10KB)
    - Configure CORS allowlist (`phyziq.com`, localhost dev)
    - Configure structured JSON error handler returning `ApiError` envelope
    - _Requirements: 10.6, 11.8_

  - [ ] 4.2 Implement Redis-based rate limiter middleware
    - OTP endpoints: 3 requests/hour/phone
    - General API: 1000 requests/hour/member JWT
    - _Requirements: 11.1 (auth security)_

  - [ ]* 4.3 Write property test: large response compression
    - **Property 41: Large Response Compression**
    - **Validates: Requirements 10.6**


- [ ] 5. Authentication module — OTP, JWT, and session management
  - [ ] 5.1 Implement OTP request and delivery service
    - `POST /auth/otp/request`: validates E.164 phone, checks Redis rate limit, calls Twilio/Africa's Talking (WhatsApp primary, SMS fallback within 30s, voice OTP on second retry)
    - Store OTP in Redis: key `otp:{phone}`, TTL 300s
    - _Requirements: 1.3, 1.4, 11.1_

  - [ ] 5.2 Implement OTP verification and JWT issuance
    - `POST /auth/otp/verify`: validates code + expiry from Redis, UPSERT member, prompt consent for new members, issue HS256 JWT (24h) + refresh token (30d in HttpOnly cookie)
    - JWT payload: `{ sub, role, gym_id, iat, exp }`
    - `POST /auth/refresh`: validate HttpOnly refresh token from Redis, issue new access token
    - `POST /auth/logout`: delete refresh token from Redis
    - _Requirements: 11.1_

  - [ ]* 5.3 Write property test: JWT token expiry
    - **Property 42: JWT Token Expiry**
    - **Validates: Requirements 11.1**

  - [ ] 5.4 Implement JWT authentication middleware
    - Verify HS256 signature, check `exp`, extract `sub`/`role`/`gym_id` into `req.auth`
    - Return `TOKEN_EXPIRED` error to trigger client refresh flow
    - Gym owner session max 8h enforced by JWT `exp` (no refresh for gym owner role)
    - _Requirements: 7.10, 11.1_


- [ ] 6. Checkpoint — Core infrastructure verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Consent and privacy module
  - [ ] 7.1 Implement consent management endpoints
    - `POST /members/me/consent`: upsert consent record (type: general | health_data | ai_training), write to `consent_records`, log to `compliance_events`
    - `GET /members/me/consent`: return all three consent categories with granted/revoked status
    - _Requirements: 1.10, 11.3_

  - [ ] 7.2 Implement consent withdrawal and health data deletion job
    - On `health_data` consent revocation: immediately block new health writes, enqueue Bull job with 72h delay
    - Job execution: `DELETE FROM ncd_profiles WHERE member_id = ?`, `DELETE FROM biometric_logs WHERE member_id = ?`, send confirmation notification, write to `compliance_events`
    - _Requirements: 11.4_

  - [ ]* 7.3 Write property test: health data deletion after consent withdrawal
    - **Property 43: Health Data Deletion After Consent Withdrawal**
    - **Validates: Requirements 11.4**

  - [ ] 7.4 Implement ODPC member count monitoring alert
    - Background job: count `consent_records` where `consent_type = 'health_data'` and `granted = TRUE`; fire alert when approaching 100
    - Write ODPC registration events to `compliance_events`
    - _Requirements: 11.5_


- [ ] 8. Onboarding module — QR decode, registration, and NCD screening
  - [ ] 8.1 Implement QR code decode and pre-fill endpoint
    - `POST /onboarding/qr-context`: decode `qr_code_token`, look up `gym_partners` record, return `{ gym_name, location, equipment_list }`
    - If token invalid or gym inactive, return 404
    - _Requirements: 1.1_

  - [ ]* 8.2 Write property test: QR code pre-fill consistency
    - **Property 1: QR Code Pre-fill Consistency**
    - **Validates: Requirements 1.1**

  - [ ] 8.3 Implement registration form submission endpoint
    - `POST /onboarding/register`: Zod schema validates all required fields and physiological bounds; UPSERT `members`; link `gym_id` if from QR context; support gym-free path
    - _Requirements: 1.2, 1.5, 1.9_

  - [ ]* 8.4 Write property test: registration validation completeness
    - **Property 2: Registration Validation Completeness**
    - **Validates: Requirements 1.2, 1.5**

  - [ ] 8.5 Implement NCD screening submission endpoint
    - `POST /onboarding/ncd-screening`: require `health_data` consent check before accepting; write to `HealthDataRepository` (Health_Data_Store only, not main DB)
    - _Requirements: 1.6, 1.7, 1.10_


- [ ] 9. ML Generation Layer — NCD Substitution Engine
  - [ ] 9.1 Implement NCD substitution rules table and lookup service in `packages/ai-engine`
    - Seed `ncd_substitution_rules` table with `(food_item_id, ncd_risk_type) → substitute_food_item_id` mappings
    - `applyNcdSubstitutions(plan, ncdProfile)`: deterministic rule lookup, returns modified plan
    - `reverseNcdSubstitutions(plan, ncdProfile)`: inverse mapping for round-trip property
    - _Requirements: 2.1_

  - [ ]* 9.2 Write property test: NCD substitution correctness
    - **Property 4: NCD Substitution Correctness**
    - **Validates: Requirements 2.1**

  - [ ]* 9.3 Write property test: NCD substitution round-trip
    - **Property 10: NCD Substitution Round-Trip**
    - **Validates: Requirements 2.8**

  - [ ] 9.4 Implement NCD conflict detection service
    - `detectNcdConflicts(mealLog, ncdProfile)`: check meal item nutritional values against NCD thresholds (GI bounds for diabetes, sodium bounds for hypertension); return warnings array with recommended alternatives and confidence scores
    - _Requirements: 2.3_

  - [ ]* 9.5 Write property test: NCD conflict detection coverage
    - **Property 6: NCD Conflict Detection Coverage**
    - **Validates: Requirements 2.3**


- [ ] 10. ML Generation Layer — Macro Adaptation and Grocery List Engine
  - [ ] 10.1 Implement Macro Adaptation Engine in `packages/ai-engine`
    - `adaptMacroTargets(weightLogs: BiometricLog[], goal, baselineTDEE)`: exponential moving average on 7-day weight trend, returns adjusted `{ calories, protein_g, carbs_g, fat_g }`
    - Direction check: weight-gain trend → reduce calories for fat-loss goal; weight-loss trend → increase calories for muscle-gain goal
    - _Requirements: 2.4_

  - [ ]* 10.2 Write property test: macro adaptation direction
    - **Property 7: Macro Adaptation Direction**
    - **Validates: Requirements 2.4**

  - [ ] 10.3 Implement Grocery List generator
    - `generateGroceryList(weeklyNutritionPlan)`: aggregate all ingredient references across all meals, group by food category, include estimated quantities
    - _Requirements: 2.6_

  - [ ]* 10.4 Write property test: grocery list coverage
    - **Property 8: Grocery List Coverage**
    - **Validates: Requirements 2.6**

  - [ ] 10.5 Implement budget optimiser for grocery list
    - Sort items by estimated cost ascending; flag three lowest-cost substitutes per protein source
    - _Requirements: 2.7_

  - [ ]* 10.6 Write property test: budget optimiser ordering
    - **Property 9: Budget Optimiser Ordering**
    - **Validates: Requirements 2.7**


- [ ] 11. ML Generation Layer — Progressive Overload and Volume Engines
  - [ ] 11.1 Implement Progressive Overload Engine in `packages/ai-engine`
    - `computeNextSessionLoad(exerciseLogs: WorkoutLog[], fitnessLevel)`: linear periodisation algorithm; returns `{ exercise_id, recommended_weight_kg, recommended_reps, recommended_sets, confidence }`
    - Bounds: `recommended_weight_kg > 0`, max single-step increase 15% (`≤ logged_weight_kg * 1.15`), confidence in [0, 100]
    - _Requirements: 3.1_

  - [ ]* 11.2 Write property test: progressive overload safety bounds
    - **Property 11: Progressive Overload Safety Bounds**
    - **Validates: Requirements 3.1**

  - [ ] 11.3 Implement target load increase for consistent overperformance
    - In `computeNextSessionLoad`: detect 3 consecutive sessions exceeding target by >20%; return new target in range `[target × 1.05, target × 1.10]`
    - _Requirements: 3.4_

  - [ ]* 11.4 Write property test: progressive overload target range
    - **Property 14: Progressive Overload Target Range**
    - **Validates: Requirements 3.4**

  - [ ] 11.5 Implement recovery-based intensity reduction
    - `applyRecoveryReduction(session, recentRecoveryScores)`: if two consecutive scores < 5, return session with intensity ≤ `original × 0.85`; attach `Confidence_Indicator`
    - _Requirements: 3.3_

  - [ ]* 11.6 Write property test: recovery-based intensity reduction
    - **Property 13: Recovery-Based Intensity Reduction**
    - **Validates: Requirements 3.3**

  - [ ] 11.7 Implement Volume Redistribution Engine
    - `redistributeMissedVolume(weekSchedule, missedSessionId)`: spread missed volume across remaining sessions respecting recovery constraints; update `plan_sessions.status = 'rebuilt'` and set `adaptation_note`
    - _Requirements: 3.2_

  - [ ]* 11.8 Write property test: volume conservation on missed session
    - **Property 12: Volume Conservation on Missed Session**
    - **Validates: Requirements 3.2**


- [ ] 12. ML Generation Layer — Equipment constraint and plan consistency
  - [ ] 12.1 Implement equipment constraint filter for plan generation
    - `filterExercisesByEquipment(exercises, equipmentList)`: return only exercises where `equipment_required ⊆ equipmentList`
    - Applied during initial plan generation using gym QR context or member personal preferences
    - _Requirements: 3.7_

  - [ ]* 12.2 Write property test: equipment constraint respect
    - **Property 16: Equipment Constraint Respect**
    - **Validates: Requirements 3.7**

  - [ ]* 12.3 Write property test: weekly volume consistency invariant
    - **Property 17: Weekly Volume Consistency Invariant**
    - **Validates: Requirements 3.8**

- [ ] 13. Checkpoint — ML engine verification
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 14. AI Orchestration — LLM async job queue infrastructure
  - [ ] 14.1 Set up Redis Bull queue and worker process in `apps/api`
    - Create Bull queues: `llm-jobs`, `cv-jobs`, `export-jobs`, `sync-jobs`, `report-jobs`
    - Worker process reads from queues, processes jobs, writes results to DB
    - WebSocket / SSE push "job_complete" event to client when job finishes
    - _Requirements: 4.1, 4.2, 8.1_

  - [ ] 14.2 Implement LLM request pipeline using Claude 3.5 Sonnet
    - `POST /coach/chat` and plan narrative generation enqueue `llm-jobs`; return `202 { job_id }` immediately
    - Worker calls Anthropic API with structured JSON schema output; writes result to DB; pushes WS event
    - Degrade gracefully: if queue depth > 500 or job exceeds 30s, return `AI_JOB_TIMEOUT` with `confidence = 0`
    - _Requirements: 8.1, 4.1_


- [ ] 15. AI Orchestration — Computer Vision and voice transcription
  - [ ] 15.1 Implement food photo recognition pipeline
    - `POST /logs/meal/photo`: upload image to S3, enqueue `cv-jobs` job with pre-signed URL, return `202 { job_id }`
    - CV worker: call Google Vision API, fuzzy-match labels to `food_items` using pgvector cosine similarity, write `meal_log_draft`, push WS event
    - Every food item in response includes `confidence` in [0, 100]
    - _Requirements: 4.1, 4.3_

  - [ ]* 15.2 Write property test: confidence indicator presence on AI estimates
    - **Property 18: Confidence Indicator Presence on AI Estimates**
    - **Validates: Requirements 4.3**

  - [ ] 15.3 Implement voice meal log transcription pipeline
    - `POST /logs/meal/voice`: upload audio to S3, transcribe via Whisper API, pass transcription to LLM layer for food item extraction, write draft log, push WS event
    - _Requirements: 4.2_


- [ ] 16. Logging module — workout, meal, and correction flows
  - [ ] 16.1 Implement manual workout log endpoint
    - `POST /logs/workout`: validate with Zod (exercise, weight_kg, reps, sets), insert `workout_logs`, return updated session summary within 2s
    - Set `synced = TRUE` when written online; handle `offline_id` dedup field
    - _Requirements: 4.6_

  - [ ] 16.2 Implement manual meal log endpoint
    - `POST /logs/meal`: validate with Zod, insert `meal_logs`, run `detectNcdConflicts` and attach warnings to response
    - _Requirements: 4.6, 2.3_

  - [ ] 16.3 Implement correction flow endpoint
    - `PATCH /logs/meal/{id}`: pre-populate correction form state from AI estimate; on submit, persist corrected values, store original in `corrections` JSONB field, flip `log_source` signal for training
    - _Requirements: 4.4, 4.5_

  - [ ]* 16.4 Write property test: correction pre-population fidelity
    - **Property 19: Correction Pre-Population Fidelity**
    - **Validates: Requirements 4.4**

  - [ ]* 16.5 Write property test: correction persistence
    - **Property 20: Correction Persistence**
    - **Validates: Requirements 4.5**


- [ ] 17. Plan module — generation, adaptation, and Free Preview
  - [ ] 17.1 Implement initial plan generation service
    - Orchestrate: fetch NCD profile from `HealthDataRepository` → apply NCD substitutions → apply equipment filter → compute progressive overload seeds → enqueue LLM job for plan narrative → write `adaptive_plans` record with `status = 'active'`
    - Target: plan available for Free Preview within 10s on 3G
    - _Requirements: 1.8, 2.1, 3.7_

  - [ ] 17.2 Implement Free Preview endpoint
    - `GET /onboarding/preview-plan`: return full 7-day plan data with all sessions and meals; set `is_paid = FALSE`; export actions gated by `PlanPreviewGate`
    - _Requirements: 5.1_

  - [ ]* 17.3 Write property test: free preview content completeness
    - **Property 22: Free Preview Content Completeness**
    - **Validates: Requirements 5.1**

  - [ ] 17.4 Implement plan adaptation trigger
    - `POST /plans/adapt`: triggered by missed session (auto within 6h), recovery score drop, performance overachievement; call appropriate ML engine, increment `adaptive_plans.version`, trigger export invalidation
    - NCD plan regeneration: triggered when `ncd_profiles` updated; complete within 24h
    - _Requirements: 3.2, 3.3, 3.4, 2.5_

  - [ ] 17.5 Implement exercise swap endpoint
    - Within plan adaptation: pgvector cosine similarity search on `exercises.embedding` for biomechanically equivalent swap (same movement pattern); enqueue LLM job for one-sentence rationale; return within 3s for ML portion
    - _Requirements: 3.5, 3.6_

  - [ ]* 17.6 Write property test: exercise swap response completeness
    - **Property 15: Exercise Swap Response Completeness**
    - **Validates: Requirements 3.6**

  - [ ] 17.7 Implement NCD medical disclaimer injection
    - Middleware on nutrition plan responses: if member has any active NCD risk flag, append disclaimer text to response
    - _Requirements: 2.2_

  - [ ]* 17.8 Write property test: NCD disclaimer presence
    - **Property 5: NCD Disclaimer Presence**
    - **Validates: Requirements 2.2**


- [ ] 18. Checkpoint — Core member flow verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Payment module — Paystack M-Pesa STK Push integration
  - [ ] 19.1 Implement `PaymentModule` with `initiatePayment` function and multi-rail router
    - Router map: `mpesa → PaystackMpesaRouter`, `card_ke → PaystackCardRouter`, `pesalink → PaystackPesalinkRouter`, `card_intl → StripeConnectRouter`
    - `POST /payments/initiate`: check Redis idempotency key, insert `payment_transactions (status=pending)`, call Paystack STK Push, return `202 { transaction_id, status: "waiting" }`
    - Encrypt all Paystack credentials at rest; read API keys from AWS Secrets Manager
    - _Requirements: 5.4, 6.1, 6.3, 6.7_

  - [ ]* 19.2 Write property test: payment idempotency
    - **Property 27: Payment Idempotency**
    - **Validates: Requirements 6.3**

  - [ ] 19.3 Implement Paystack webhook handler and HMAC verification
    - `POST /webhooks/paystack`: verify `X-Paystack-Signature` HMAC-SHA512; reject with 401 on failure; on success update `payment_transactions`, insert `payment_audit_log`, verify `amount_kes == gateway_amount`
    - _Requirements: 6.5, 6.8_

  - [ ]* 19.4 Write property test: financial amount invariant
    - **Property 30: Financial Amount Invariant**
    - **Validates: Requirements 6.8**

  - [ ] 19.5 Implement payment retry with exponential backoff
    - On Paystack 5xx: retry after 1s, then 2s, then mark `failed`; maximum 3 total attempts
    - _Requirements: 6.4_

  - [ ]* 19.6 Write property test: retry count invariant
    - **Property 28: Retry Count Invariant**
    - **Validates: Requirements 6.4**

  - [ ] 19.7 Implement STK Push timeout handler
    - Schedule Redis delayed job at T+90s; if transaction still `pending`, set `status = 'timed_out'`, `gateway_amount = NULL`, notify member
    - _Requirements: 5.6_

  - [ ]* 19.8 Write property test: payment timeout non-charge invariant
    - **Property 23: Payment Timeout Non-Charge Invariant**
    - **Validates: Requirements 5.6**


- [ ] 20. Payment module — plan unlock, subscriptions, and transaction history
  - [ ] 20.1 Implement plan unlock on payment confirmation
    - On `payment_confirmed` event: set `adaptive_plans.is_paid = TRUE`, enqueue export generation jobs (PDF + DOCX), push WS event to member within 10s
    - Preserve plan state on payment failure: plan_data, status, is_paid unchanged
    - _Requirements: 5.5, 5.8_

  - [ ]* 20.2 Write property test: plan state preservation on payment failure
    - **Property 24: Plan State Preservation on Payment Failure**
    - **Validates: Requirements 5.7**

  - [ ] 20.3 Implement subscription billing with billing anchor day
    - Store `billing_anchor_day` on subscription creation; scheduler fires recurring charge on same calendar day; handle month-end edge cases by rolling to last day of shorter months
    - Notify member 24h before each renewal
    - _Requirements: 5.9_

  - [ ]* 20.4 Write property test: subscription billing date consistency
    - **Property 25: Subscription Billing Date Consistency**
    - **Validates: Requirements 5.9**

  - [ ] 20.5 Implement transaction history endpoint
    - `GET /payments/history`: return all transactions for authenticated member with date, amount, plan_reference, payment_method; paginated
    - _Requirements: 5.10_

  - [ ]* 20.6 Write property test: transaction history completeness
    - **Property 26: Transaction History Completeness**
    - **Validates: Requirements 5.10**

  - [ ] 20.7 Implement pre-payment fee disclosure middleware
    - Before any payment initiation: validate that all fees (plan fee, subscription fee, applicable taxes) are disclosed in the response payload; block initiation if disclosure payload is incomplete
    - _Requirements: 5.3_


- [ ] 21. Checkpoint — Payment flow verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Conversational AI Coach module
  - [ ] 22.1 Implement chat endpoint with sliding context window
    - `POST /coach/chat`: inject member's current `Adaptive_Plan` summary as system context (not user-visible); maintain last 5 messages in Redis per session; enqueue `llm-jobs`
    - `GET /coach/chat/history`: return last 5 messages
    - _Requirements: 8.1, 8.4_

  - [ ]* 22.2 Write property test: conversational context window
    - **Property 35: Conversational Context Window**
    - **Validates: Requirements 8.4**

  - [ ] 22.3 Implement low-confidence coach referral
    - After LLM response: if `confidence_score < 60`, set `uncertainty_acknowledged = TRUE`, `coach_referral_offered = TRUE` in response; surface marketplace CTA in UI
    - _Requirements: 8.2_

  - [ ]* 22.4 Write property test: low-confidence coach referral
    - **Property 34: Low-Confidence Coach Referral**
    - **Validates: Requirements 8.2**

  - [ ] 22.5 Implement exception plan generation and approval flow
    - On travel/exception query: enqueue LLM job for modified plan variant; present to member for approval; on approval update `adaptive_plans.plan_data`, write to `plan_modification_log` with `triggered_by_query` and `modified_at`
    - Medical advice guard: LLM system prompt includes hard constraint against diagnoses/prescriptions
    - _Requirements: 8.3, 8.5, 8.6_

  - [ ]* 22.6 Write property test: plan modification audit trail
    - **Property 36: Plan Modification Audit Trail**
    - **Validates: Requirements 8.5**


- [ ] 23. Coach marketplace module — profiles, bookings, and escrow
  - [ ] 23.1 Implement coach listing and profile endpoints
    - `GET /coaches`: filter by specialisation, rating, price; paginate; return credentials, rating_avg, availability calendar, session_fee_kes, is_verified badge
    - `GET /coaches/{id}`: full profile with cancellation_policy
    - _Requirements: 9.1_

  - [ ] 23.2 Implement coach verification badge workflow
    - `POST /coaches/verify` (admin): set `is_verified = TRUE` after government ID + qualification doc check; display "Verified" badge
    - _Requirements: 9.5_

  - [ ] 23.3 Implement session booking and escrow payment
    - `POST /bookings`: deduct session fee via `PaymentModule` (escrow sub-account), insert `coach_bookings (status=pending)`, confirm to both parties
    - Cron job: at `scheduled_at + duration + buffer`, check `escrow_released = FALSE` for completed sessions; deduct commission (10–15%); transfer net to coach Paystack sub-account; set `escrow_released = TRUE`
    - _Requirements: 9.2, 9.4_

  - [ ]* 23.4 Write property test: commission range enforcement
    - **Property 37: Commission Range Enforcement**
    - **Validates: Requirements 9.4**

  - [ ] 23.5 Implement cancellation refund logic
    - `POST /bookings/{id}/cancel`: if >24h before session → 100% refund via Paystack refund API within 5 business days; if ≤24h → apply `coach.cancellation_policy.refund_pct`; notify both parties
    - _Requirements: 9.6, 9.7_

  - [ ]* 23.6 Write property test: full refund on early cancellation
    - **Property 38: Full Refund on Early Cancellation**
    - **Validates: Requirements 9.6**

  - [ ]* 23.7 Write property test: late cancellation policy compliance
    - **Property 39: Late Cancellation Policy Compliance**
    - **Validates: Requirements 9.7**

  - [ ] 23.8 Implement session rating and review submission
    - `POST /bookings/{id}/review`: prompt within 24h of session end; validate 1–5 stars; update `coaches.rating_avg`; set `review_submitted = TRUE`
    - _Requirements: 9.3_

  - [ ] 23.9 Implement coach earnings dashboard with transparent commission display
    - Show commission_pct and deductions per transaction before and after payout
    - _Requirements: 9.8_


- [ ] 24. Gym owner module — dashboard, QR management, and challenges
  - [ ] 24.1 Implement gym analytics aggregator cron job
    - Hourly job: query `workout_logs`, `meal_logs`, `plan_sessions` for each gym's member cohort; compute `total_active_members`, `avg_plan_completion_pct`, `avg_weekly_sessions`, `top_exercises`, `session_heatmap`, `at_risk_member_count`, `at_risk_member_ids`; upsert `gym_analytics_snapshots`
    - At-risk flag: any member with no `workout_logs` in last 7 calendar days
    - Privacy: store only member IDs in `at_risk_member_ids`, not any NCD or health data
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]* 24.2 Write property test: dashboard engagement flag
    - **Property 31: Dashboard Engagement Flag**
    - **Validates: Requirements 7.5**

  - [ ]* 24.3 Write property test: health data exclusion from dashboard
    - **Property 33: Health Data Exclusion from Dashboard**
    - **Validates: Requirements 7.8**

  - [ ] 24.4 Implement gym dashboard API endpoint
    - `GET /gym/dashboard`: read from `gym_analytics_snapshots` (max 1h old); support date range filter; respond within 3s
    - Require gym_owner JWT role; no individual NCD/biometric data in response
    - _Requirements: 7.1, 7.2, 7.3, 7.8_

  - [ ] 24.5 Implement QR code generation and download endpoint
    - `GET /gym/qr-code`: generate unique QR code for gym (encode `qr_code_token`), upload PNG to S3, return pre-signed URL for PNG and PDF variants
    - _Requirements: 7.6_

  - [ ] 24.6 Implement cohort challenge creation and leaderboard
    - `POST /gym/challenges`: create challenge, enrol all consenting members linked to gym in `challenge_enrolments`
    - `GET /gym/challenges/{id}/leaderboard`: live leaderboard from aggregated logs
    - _Requirements: 7.7_

  - [ ]* 24.7 Write property test: challenge enrolment coverage
    - **Property 32: Challenge Enrolment Coverage**
    - **Validates: Requirements 7.7**

  - [ ] 24.8 Implement monthly engagement report generation
    - `POST /gym/reports/monthly`: enqueue `report-jobs` Bull job; worker queries `gym_analytics_snapshots`, renders Handlebars HTML template, Puppeteer generates PDF, uploads to S3; email pre-signed URL via SendGrid within 60s
    - _Requirements: 7.9_


- [ ] 25. Checkpoint — Gym dashboard and marketplace verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 26. Plan export system — PDF and DOCX generation
  - [ ] 26.1 Implement DOCX export worker using `docx` npm library
    - Enqueue `export-jobs` on plan unlock; worker: fetch `adaptive_plans.plan_data`, map to `docx` section objects (heading styles for week/day, table objects for sets/reps, paragraph objects for meals + macros), apply PHYZIQ brand header/footer
    - Compute SHA-256 content hash of canonical JSON; store in `plan_exports.content_hash`
    - Upload to S3 `exports/{member_id}/{plan_id}/plan.docx` with server-side AES-256
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 26.2 Implement PDF export worker using Puppeteer
    - Render DOCX → Handlebars HTML template → Puppeteer PDF; upload to S3; insert `plan_exports` record with `expires_at = NOW() + 90 days`, `is_valid = TRUE`
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 26.3 Write property test: export content completeness
    - **Property 45: Export Content Completeness**
    - **Validates: Requirements 12.2**

  - [ ] 26.4 Implement export download endpoint with pre-signed URL
    - `GET /plans/{id}/export/{format}`: check `is_paid`, check `is_valid`, check `expires_at`; return pre-signed S3 URL (TTL 1h) without regenerating if within 90-day window
    - _Requirements: 5.8, 12.1, 12.5_

  - [ ]* 26.5 Write property test: export retention period
    - **Property 47: Export Retention Period**
    - **Validates: Requirements 12.5**

  - [ ] 26.6 Implement export invalidation on plan version increment
    - When `adaptive_plans.version` increments: set `is_valid = FALSE` on all linked `plan_exports` records immediately; enqueue new export jobs; make updated exports available within 30s
    - _Requirements: 12.4_

  - [ ]* 26.7 Write property test: export invalidation on plan update
    - **Property 46: Export Invalidation on Plan Update**
    - **Validates: Requirements 12.4**

  - [ ]* 26.8 Write property test: plan export round-trip
    - **Property 48: Plan Export Round-Trip**
    - **Validates: Requirements 12.6**


- [ ] 27. Offline-first mobile sync module
  - [ ] 27.1 Implement Expo SQLite offline schema and write-through layer
    - Create `offline_workout_logs`, `offline_meal_logs`, `cached_plans` tables in Expo SQLite
    - All mobile writes go to SQLite first (`synced_at = NULL`), then attempt server POST if online
    - _Requirements: 10.1, 10.2_

  - [ ] 27.2 Implement background sync worker (React Native)
    - On connectivity detected (via Expo `NetInfo`): fetch all SQLite records where `synced_at IS NULL`; batch POST to `POST /sync`; on success set `synced_at = NOW()`; on `409 Conflict` apply local-wins, set `has_conflict = TRUE`, notify user
    - Sync must complete within 5 minutes of connectivity restoration
    - _Requirements: 10.3, 10.4_

  - [ ]* 27.3 Write property test: offline log sync round-trip
    - **Property 21: Offline Log Sync Round-Trip**
    - **Validates: Requirements 4.7, 10.2**

  - [ ] 27.4 Implement offline cache eviction job
    - Nightly local job: `DELETE FROM offline_workout_logs WHERE logged_at < datetime('now', '-30 days')`; same for `offline_meal_logs` and `cached_plans`
    - _Requirements: 10.5_

  - [ ]* 27.5 Write property test: offline cache age limit
    - **Property 40: Offline Cache Age Limit**
    - **Validates: Requirements 10.5**

  - [ ] 27.6 Implement low-bandwidth adaptive content serving
    - Detect throughput via `NetInfo` Expo API; when < 256kbps, replace image URLs in plan responses with `/img/thumb/` low-res CDN variants; defer non-essential background fetches
    - Server-side: `POST /sync` and `GET /plans` responses gzip/Brotli compressed
    - _Requirements: 10.6, 10.7_

  - [ ] 27.7 Implement offline mode network status indicator
    - `SyncStatus` enum drives amber banner in `<TodayDashboard />`: "Offline — logged data will sync when connected"
    - _Requirements: 4.8_


- [ ] 28. Checkpoint — Offline sync and export verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Next.js web app — member web and shared UI components
  - [ ] 29.1 Bootstrap `apps/web` Next.js 14 (App Router) with NativeWind and shared `packages/ui`
    - Configure `packages/ui` component library for web and mobile with NativeWind styling
    - Set up API client in `packages/shared` pointing to `apps/api`
    - _Requirements: all (web UI foundation)_

  - [ ] 29.2 Implement `<ConfidenceChip />`, `<WeekNavigator />`, `<CorrectionSheet />` components
    - `<ConfidenceChip confidence={number} source="ai"|"confirmed"|"manual" />`: three visual states (high ≥80% green, estimated 40–79% blue, low <40% amber)
    - `<WeekNavigator week={WeekPlan} />`: seven pill buttons with DayStatus states (completed, scheduled, missed, rebuilt, rest)
    - `<CorrectionSheet entry={LogEntry} onSubmit={fn} />`: bottom sheet mobile / side panel web; pre-populate from AI estimate
    - _Requirements: 4.3, 4.4, 3.2_

  - [ ] 29.3 Implement `<TodayDashboard />` page
    - Greeting, today's plan card (workout + meal + recovery), confidence chips, recent logs, weekly summary, AI coach message, gym schedule panel
    - Show `SyncStatus.OFFLINE` amber banner when offline
    - _Requirements: 4.8, 3.3_

  - [ ] 29.4 Implement `<PlanPreviewGate />` and `<MpesaPaymentSheet />` components
    - `<PlanPreviewGate isPaid={boolean} />`: intercept download clicks, render `<PaywallModal />` with KES 450 one-time / KES 1,200/month pricing and full fee disclosure
    - `<MpesaPaymentSheet amount phone />`: poll `/payments/{id}/status` every 5s up to 90s; show waiting/success/failed states
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 29.5 Implement onboarding flow UI (QR → registration → NCD screening → preview)
    - QR scan → pre-fill form → OTP verification → consent screens → NCD questionnaire → Free Preview
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.8, 1.9, 1.10_


- [ ] 30. Next.js web app — Gym Owner Dashboard UI
  - [ ] 30.1 Implement gym owner dashboard page with analytics widgets
    - Metrics: total active members, avg plan completion (7 days), avg weekly sessions, top 5 exercises
    - Date range filter (responds within 3s), engagement heatmap, at-risk members count (anonymised), live challenge leaderboard
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ] 30.2 Implement gym QR code management UI
    - QR code display and PNG/PDF download button
    - _Requirements: 7.6_

  - [ ] 30.3 Implement monthly report request UI
    - Button triggers `POST /gym/reports/monthly`; show progress state; confirm email delivery
    - _Requirements: 7.9_

- [ ] 31. React Native / Expo mobile app
  - [ ] 31.1 Bootstrap `apps/mobile` Expo SDK 52 project
    - Configure Expo Router, Expo SecureStore for JWT storage, Expo SQLite for offline cache, Expo NetInfo for connectivity detection
    - _Requirements: 10.1, 11.1_

  - [ ] 31.2 Implement mobile logging flows (photo, voice, manual)
    - Photo log: camera capture → `POST /logs/meal/photo` → job polling via WS → display food items with confidence chips → correction sheet
    - Voice log: microphone capture → `POST /logs/meal/voice` → same pipeline
    - Manual log: form with exercise/food entry
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 31.3 Implement mobile offline-first plan viewing and logging
    - Load plan from SQLite on app launch (zero additional loading time when offline)
    - All logs written to SQLite first; sync worker runs on connectivity restore
    - _Requirements: 10.1, 10.2, 10.3_


- [ ] 32. Checkpoint — Full stack UI and mobile verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 33. Integration tests — health data isolation and consent lifecycle
  - [ ] 33.1 Write integration tests for `HealthDataRepository` isolation
    - Spin up testcontainers PostgreSQL; verify `app_svc` role cannot query health tables; verify `health_data_svc` role can; verify all HealthDataRepository methods write to `health_data_access_log`
    - _Requirements: 11.2, 11.6_

  - [ ] 33.2 Write integration tests for consent withdrawal and deletion job
    - Submit health_data consent revocation; run deletion job; assert zero rows in `ncd_profiles` and `biometric_logs` for that member_id
    - _Requirements: 11.4_

  - [ ] 33.3 Write integration tests for payment transaction lifecycle
    - Full lifecycle: initiate → webhook callback → plan unlock; assert `payment_audit_log` entries, `gateway_amount == amount_kes`, `is_paid = TRUE`
    - _Requirements: 6.5, 6.8, 5.5_

  - [ ] 33.4 Write integration tests for plan version increment and export invalidation
    - Increment `adaptive_plans.version`; assert all linked `plan_exports.is_valid = FALSE`; assert new export job enqueued
    - _Requirements: 12.4_

  - [ ] 33.5 Write integration tests for dashboard health data exclusion
    - Call every `GET /gym/dashboard` endpoint as gym_owner; assert no `ncd_profiles` or `biometric_logs` fields present in any response payload
    - _Requirements: 7.8_


- [ ] 34. Security hardening and input validation
  - [ ] 34.1 Audit all API endpoints for parameterised queries and Zod schema coverage
    - Verify no string-concatenated SQL anywhere in codebase; all user inputs pass through Zod before business logic
    - _Requirements: 11.8_

  - [ ] 34.2 Implement CORS strict allowlist, HSTS headers, and JWT hardening
    - CORS: only `phyziq.com` and localhost; no wildcard
    - JWT: HS256 with 512-bit secret; access tokens 24h; refresh tokens in `HttpOnly`, `SameSite=Strict` cookies (web); Expo SecureStore (mobile)
    - _Requirements: 11.1, 11.8_

  - [ ] 34.3 Implement Paystack and Anthropic webhook signature verification
    - HMAC-SHA512 for Paystack; `anthropic-signature` header for Anthropic; invalid signatures → 401 + PagerDuty alert
    - _Requirements: 6.7_

- [ ] 35. Monitoring, alerting, and CI/CD pipeline
  - [ ] 35.1 Instrument API with OpenTelemetry and configure key alerts
    - Metrics: API p95 latency, AI job queue depth, payment success rate, sync error rate
    - Alerts: payment success rate <90% in 5min (PagerDuty), queue depth >500 (Slack), health data unauthorised access (PagerDuty), OTP delivery failure >20%/hr (Slack), API 5xx >1% (Slack), data breach (PagerDuty + ODPC workflow)
    - _Requirements: 11.7_

  - [ ] 35.2 Configure GitHub Actions CI pipeline
    - Steps: `pnpm install` + Turborepo cache → `tsc --noEmit` → ESLint + Prettier → Vitest (unit + property) → integration tests (testcontainers) → Next.js + API build → deploy staging on merge to main → Playwright E2E smoke tests → production deploy with approval gate → `prisma migrate deploy` → `/api/health` check
    - _Requirements: all (delivery pipeline)_

  - [ ] 35.3 Configure Expo EAS Build and OTA updates
    - EAS Build for iOS and Android; Expo Updates for JS-only OTA changes without app store review
    - _Requirements: all (mobile delivery)_


- [ ] 36. Final checkpoint — All systems verified
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 48 property tests are marked optional
- Property tests use `fast-check` with a minimum of 100 iterations per property (`numRuns: 100`)
- Test files follow the naming convention `*.property.test.ts` alongside source modules, tagged `// Feature: phyziq-platform, Property N: [Name]`
- Unit and integration tests use `vitest` + `testcontainers` (PostgreSQL container per test suite)
- Each task references specific requirements for full traceability
- Checkpoints at tasks 6, 13, 18, 21, 25, 28, 32, 36 ensure incremental validation
- The `HealthDataRepository` ESLint import boundary rule is enforced from task 3.2 onward
- Health_Data_Store is a separate PostgreSQL instance — not a schema — with its own connection string and KMS key
- All LLM and CV calls are async via Redis Bull queues; HTTP layer returns `202 { job_id }` immediately


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1", "4.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.4"] },
    { "id": 6, "tasks": ["5.3", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.4"] },
    { "id": 8, "tasks": ["7.3", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "8.5"] },
    { "id": 10, "tasks": ["8.4", "9.1"] },
    { "id": 11, "tasks": ["9.2", "9.3", "9.4", "9.5"] },
    { "id": 12, "tasks": ["10.1", "10.3"] },
    { "id": 13, "tasks": ["10.2", "10.4", "10.5", "10.6"] },
    { "id": 14, "tasks": ["11.1", "11.3", "11.5", "11.7"] },
    { "id": 15, "tasks": ["11.2", "11.4", "11.6", "11.8"] },
    { "id": 16, "tasks": ["12.1"] },
    { "id": 17, "tasks": ["12.2", "12.3"] },
    { "id": 18, "tasks": ["14.1"] },
    { "id": 19, "tasks": ["14.2", "15.1", "15.3"] },
    { "id": 20, "tasks": ["15.2", "16.1", "16.2"] },
    { "id": 21, "tasks": ["16.3"] },
    { "id": 22, "tasks": ["16.4", "16.5", "17.1"] },
    { "id": 23, "tasks": ["17.2", "17.4", "17.7"] },
    { "id": 24, "tasks": ["17.3", "17.5", "17.8"] },
    { "id": 25, "tasks": ["17.6"] },
    { "id": 26, "tasks": ["19.1", "19.3"] },
    { "id": 27, "tasks": ["19.2", "19.5", "19.7"] },
    { "id": 28, "tasks": ["19.4", "19.6", "19.8", "20.1"] },
    { "id": 29, "tasks": ["20.2", "20.3", "20.5", "20.7"] },
    { "id": 30, "tasks": ["20.4", "20.6"] },
    { "id": 31, "tasks": ["22.1", "22.3"] },
    { "id": 32, "tasks": ["22.2", "22.4", "22.5"] },
    { "id": 33, "tasks": ["22.6", "23.1", "23.2"] },
    { "id": 34, "tasks": ["23.3", "23.8"] },
    { "id": 35, "tasks": ["23.4", "23.5", "23.9"] },
    { "id": 36, "tasks": ["23.6", "23.7", "24.1", "24.5"] },
    { "id": 37, "tasks": ["24.2", "24.3", "24.4", "24.6", "24.8"] },
    { "id": 38, "tasks": ["24.7", "26.1"] },
    { "id": 39, "tasks": ["26.2", "26.4"] },
    { "id": 40, "tasks": ["26.3", "26.5", "26.6"] },
    { "id": 41, "tasks": ["26.7", "26.8", "27.1"] },
    { "id": 42, "tasks": ["27.2", "27.4", "27.6", "27.7"] },
    { "id": 43, "tasks": ["27.3", "27.5", "29.1"] },
    { "id": 44, "tasks": ["29.2", "29.3"] },
    { "id": 45, "tasks": ["29.4", "29.5"] },
    { "id": 46, "tasks": ["30.1", "30.2", "30.3", "31.1"] },
    { "id": 47, "tasks": ["31.2", "31.3"] },
    { "id": 48, "tasks": ["33.1", "33.2", "33.3", "34.1"] },
    { "id": 49, "tasks": ["33.4", "33.5", "34.2", "34.3"] },
    { "id": 50, "tasks": ["35.1", "35.2", "35.3"] }
  ]
}
```
