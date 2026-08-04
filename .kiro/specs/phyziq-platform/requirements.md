# Requirements Document

## Introduction

PHYZIQ is a global-architecture AI fitness platform, initially launched in Nairobi, Kenya. It combines adaptive AI coaching, a marketplace, and commerce in a single platform — no competitor currently offers this combination. The platform is built on three core principles: adaptive AI over static content, transparent economics, and offline-first low-bandwidth operation for emerging markets.

This document covers the MVP requirements for the core adaptive AI coaching loop, gym-partner onboarding, free-preview-to-paid conversion flow, NCD-aware nutrition planning, M-Pesa-native payments, and the gym-owner analytics dashboard. Compliance targets the Kenya Data Protection Act 2019 and the Digital Health Act 2023.

---

## Glossary

- **Platform**: The PHYZIQ application as a whole (web + mobile).
- **Member**: A gym-going end user registered on the Platform.
- **Gym_Owner**: A gym business owner or operator with a B2B account.
- **Coach**: A certified personal trainer, dietitian, or physiotherapist listed on the Platform marketplace.
- **Onboarding_Flow**: The guided sequence a new Member completes upon first launch, from QR scan through NCD screening to plan preview.
- **AI_Engine**: The three-layer AI orchestration system comprising the ML generation layer, LLM reasoning layer, and computer vision/perception layer.
- **Adaptive_Plan**: A workout or nutrition plan produced by the AI_Engine that updates in response to logged Member performance, recovery signals, and missed sessions.
- **NCD_Profile**: A Member's non-communicable disease risk record (diabetes risk, hypertension, cardiovascular risk) captured during Onboarding_Flow and updated over time.
- **Free_Preview**: The read-only plan visible to a Member before payment — shows the full first week, locks download/export.
- **Paid_Plan**: A plan artifact (PDF/DOCX) unlocked after a successful payment transaction.
- **M-Pesa**: The mobile money payment rail used as the primary payment method for Kenyan Members.
- **Paystack**: The payment gateway used for Kenya (M-Pesa integration) and broader Africa expansion.
- **Payment_Gateway**: The abstraction layer through which all payment rails (M-Pesa via Paystack, card, etc.) are accessed.
- **Gym_Dashboard**: The web interface available to Gym_Owners showing partner-level analytics, QR code management, and cohort data.
- **QR_Code**: A scannable code unique to each gym partner, used to pre-fill Member registration context.
- **Confidence_Indicator**: A visible percentage or label shown alongside AI-generated content to indicate the AI_Engine's certainty.
- **Correction_Flow**: The one-tap mechanism allowing a Member to override an AI-generated suggestion (meal log, exercise swap, etc.).
- **Progressive_Overload_Engine**: The sub-component of the AI_Engine that computes week-over-week load increments for strength and cardio exercises.
- **Grocery_List**: An auto-generated shopping list derived from a Member's weekly nutrition plan.
- **ODPC**: Office of the Data Protection Commissioner (Kenya) — the regulatory body requiring registration under the Kenya Data Protection Act 2019.
- **Health_Data_Store**: The architecturally isolated database partition holding NCD_Profile data and biometric logs, separated from general user data.
- **Offline_Cache**: Local device storage enabling core plan-viewing and logging features when network connectivity is unavailable.
- **OTP**: One-time password delivered via SMS or WhatsApp for authentication.
- **JWT**: JSON Web Token used for stateless session authorisation.
- **pgvector**: The PostgreSQL vector extension used for AI embedding storage and similarity search.

---

## Requirements

### Requirement 1: Gym-Partner-Linked Onboarding

**User Story:** As a new gym member, I want to scan my gym's QR code and be guided through a fast, contextualised sign-up, so that I receive a plan tailored to my gym's equipment and my health background without having to re-enter information my gym already knows.

#### Acceptance Criteria

1. WHEN a Member scans a gym QR_Code, THE Onboarding_Flow SHALL pre-fill the gym name, location, and available equipment context into the registration form.
2. WHEN a Member completes the registration form, THE Platform SHALL collect name, phone number (OTP-verified), date of birth, sex, height, weight, fitness goal, and activity level.
3. WHEN phone number verification is initiated, THE Platform SHALL deliver an OTP via SMS or WhatsApp within 60 seconds.
4. IF OTP delivery fails after two attempts, THEN THE Platform SHALL present an alternative verification option (voice call OTP) to the Member.
5. WHEN registration fields are submitted, THE Platform SHALL validate that all required fields are present and that numeric fields (height, weight, age) fall within physiologically plausible ranges before proceeding.
6. AFTER registration form submission, THE Onboarding_Flow SHALL present an NCD screening questionnaire covering diabetes risk indicators, hypertension history, and cardiovascular risk factors.
7. WHEN the NCD screening is completed, THE Platform SHALL store the responses in the Health_Data_Store, architecturally separated from general user profile data.
8. WHEN onboarding is complete, THE Platform SHALL generate and display a Free_Preview plan within 10 seconds on a standard 3G connection.
9. WHERE a Member completes onboarding without scanning a QR_Code, THE Platform SHALL support manual gym selection or a gym-free onboarding path with equivalent functionality.
10. THE Platform SHALL obtain explicit informed consent for health data collection before presenting the NCD screening questionnaire, in compliance with the Kenya Data Protection Act 2019.

---

### Requirement 2: NCD-Aware Nutrition Planning

**User Story:** As a member with a chronic health condition, I want my nutrition plan to account for my NCD risk profile, so that the food recommendations I receive are safe and medically appropriate for my condition.

#### Acceptance Criteria

1. WHEN the AI_Engine generates a nutrition plan, THE AI_Engine SHALL apply NCD-specific substitution rules derived from the Member's NCD_Profile (e.g., low-glycaemic substitutions for diabetes risk, low-sodium substitutions for hypertension risk).
2. WHEN a nutrition plan is presented to a Member with an active NCD_Profile, THE Platform SHALL display a visible disclaimer indicating that the plan is not a substitute for professional medical advice.
3. WHEN a Member logs a meal that conflicts with their NCD_Profile risk thresholds (e.g., high-sugar food for a diabetes-risk Member), THE AI_Engine SHALL display a contextual warning with a recommended alternative, alongside the Confidence_Indicator for the warning.
4. THE AI_Engine SHALL generate calorie and macro targets that adapt weekly based on the Member's logged weight trend data, following an algorithm equivalent in accuracy to evidence-based adaptive energy expenditure models.
5. WHEN a Member updates their NCD_Profile (e.g., new diagnosis or medication change), THE AI_Engine SHALL regenerate the nutrition plan within 24 hours and notify the Member of the update.
6. THE Platform SHALL generate a Grocery_List from the Member's weekly nutrition plan, grouping items by food category and including estimated quantities.
7. WHERE a Member enables the budget optimiser feature, THE Platform SHALL sort Grocery_List items by estimated cost in ascending order and flag the three lowest-cost substitutes for each protein source.
8. FOR ALL valid NCD_Profile inputs, applying the NCD substitution rules and then reversing them SHALL produce a nutrition plan equivalent to the original pre-substitution plan (round-trip property for substitution engine correctness).

---

### Requirement 3: Adaptive Workout Generation

**User Story:** As a gym member, I want my workout plan to automatically adjust when I miss sessions, log poor recovery, or consistently exceed my targets, so that I always have an appropriate and progressive training plan without manually editing it.

#### Acceptance Criteria

1. WHEN a Member logs a completed workout set with a performance metric (reps, weight, time), THE Progressive_Overload_Engine SHALL compute a recommended load for the next session of the same exercise within the same training cycle.
2. WHEN a Member misses a scheduled workout session, THE AI_Engine SHALL reschedule or redistribute the missed session's volume across the remaining sessions in that training week, within 6 hours of the missed session time.
3. WHEN a Member logs a recovery score below 5 out of 10 for two consecutive days, THE AI_Engine SHALL reduce the next session's intensity by at least 15% and flag the adjustment with a Confidence_Indicator.
4. WHEN a Member's logged performance exceeds the plan target by more than 20% for three consecutive sessions of the same exercise, THE Progressive_Overload_Engine SHALL increase the target load for that exercise by 5–10% in the next training week.
5. WHEN a Member reports an injury or selects an equipment constraint, THE AI_Engine SHALL perform an exercise swap, replacing the affected exercise with a biomechanically equivalent alternative within 3 seconds of the swap request.
6. WHEN an exercise swap is performed, THE AI_Engine SHALL display the Confidence_Indicator for the suggested replacement alongside a brief rationale (one sentence).
7. THE AI_Engine SHALL generate initial workout plans that respect the equipment list associated with the Member's gym partner (from QR_Code context) and personal equipment preferences.
8. FOR ALL workout plans generated for the same Member fitness profile and goal, the total weekly training volume (sets × reps × relative intensity) SHALL remain within ±10% across equivalent training weeks, ensuring plan consistency (invariant property).

---

### Requirement 4: AI Logging with Visible Confidence and One-Tap Correction

**User Story:** As a member, I want to log meals and workouts quickly — including by taking a photo or speaking — and see how confident the AI is in its interpretation, so that I can trust the data and fix mistakes in one tap when the AI is wrong.

#### Acceptance Criteria

1. WHEN a Member submits a photo of a meal, THE AI_Engine SHALL identify the food items present and return an estimated nutritional breakdown within 5 seconds on a standard 4G connection.
2. WHEN a Member submits a voice description of a meal, THE AI_Engine SHALL transcribe the description and return an estimated nutritional breakdown within 5 seconds.
3. WHEN the AI_Engine returns a meal log estimate, THE Platform SHALL display a Confidence_Indicator (percentage 0–100%) alongside each identified food item.
4. WHEN a Member taps the correction button on any AI-generated log entry, THE Platform SHALL present an editable form pre-populated with the current AI estimate, allowing full override of food items, quantities, and nutritional values.
5. WHEN a Member submits a correction, THE Platform SHALL persist the corrected values and use the correction as a training signal to improve future recognition for that Member.
6. WHEN a Member logs a workout set manually (exercise, weight, reps), THE Platform SHALL save the entry and update the session summary within 2 seconds.
7. IF network connectivity is unavailable during logging, THEN THE Platform SHALL store the log entry in the Offline_Cache and synchronise it with the server within 5 minutes of connectivity restoration.
8. THE Platform SHALL display a clear network status indicator when operating in offline mode so the Member is aware that data is queued for sync.

---

### Requirement 5: Free-Preview to Paid Conversion Flow

**User Story:** As a new member, I want to see my full first-week plan before paying, so that I can evaluate the quality of the AI-generated plan and make an informed purchase decision without being surprised by hidden fees.

#### Acceptance Criteria

1. WHEN the Free_Preview is displayed, THE Platform SHALL show the complete first-week workout and nutrition plan (all 7 days) in read-only mode with no content truncation.
2. WHEN a Member attempts to download or export a plan in Free_Preview mode, THE Platform SHALL display a paywall prompt explaining the one-time plan fee and the subscription option, with transparent pricing for both.
3. THE Platform SHALL display all fees (plan generation fee, subscription fee, any applicable taxes) before the Member initiates payment — no fees SHALL be revealed after the payment initiation step.
4. WHEN a Member selects the one-time plan payment option, THE Payment_Gateway SHALL initiate an M-Pesa STK Push to the Member's registered phone number within 3 seconds.
5. WHEN an M-Pesa STK Push payment is confirmed by the Payment_Gateway, THE Platform SHALL unlock the Paid_Plan download within 10 seconds and notify the Member via in-app message.
6. IF an M-Pesa STK Push payment times out (no Member response within 90 seconds), THEN THE Platform SHALL display a retry option and SHALL NOT charge the Member.
7. IF a payment transaction fails for any reason, THEN THE Platform SHALL display a human-readable error message specifying the failure reason (e.g., "Insufficient M-Pesa balance") and SHALL preserve the Member's plan state for 24 hours to allow retry.
8. WHEN the Paid_Plan is unlocked, THE Platform SHALL generate and make available for download both a PDF and a DOCX version of the plan within 30 seconds of payment confirmation.
9. WHERE a Member selects a monthly subscription, THE Platform SHALL charge the subscription fee via the Payment_Gateway on the same calendar day each month and notify the Member 24 hours before each renewal charge.
10. THE Platform SHALL provide a complete transaction history accessible to the Member within the account settings, showing date, amount, plan reference, and payment method for each transaction.

---

### Requirement 6: M-Pesa and Multi-Rail Payment Architecture

**User Story:** As a Kenyan member, I want to pay with M-Pesa natively without leaving the app, and as the platform grows, I want the payment system to support additional methods without disrupting existing integrations.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL support M-Pesa STK Push as the primary payment method for Kenyan Members, processed through Paystack.
2. WHEN a payment request is submitted to the Payment_Gateway, THE Payment_Gateway SHALL return a transaction status (pending, success, or failed) to the calling service within 5 seconds.
3. THE Payment_Gateway SHALL implement idempotency keys on all payment initiation requests, ensuring that duplicate requests for the same transaction do not result in duplicate charges.
4. IF the Paystack API returns an error response with HTTP status 5xx, THEN THE Payment_Gateway SHALL retry the request up to two times with exponential backoff before returning a failed status to the caller.
5. THE Payment_Gateway SHALL log all payment events (initiation, callback received, status update) to an immutable audit log with a UTC timestamp and transaction reference.
6. WHERE a card payment method is configured for non-Kenyan Members, THE Payment_Gateway SHALL route the transaction through Stripe Connect without requiring changes to the payment initiation interface.
7. THE Payment_Gateway SHALL encrypt all payment credentials and API keys at rest using AES-256 and in transit using TLS 1.2 or higher.
8. FOR ALL payment transactions, the amount stored in the Platform's transaction record SHALL equal the amount confirmed by the Payment_Gateway callback — no discrepancy SHALL be tolerated (invariant property for financial integrity).

---

### Requirement 7: Gym-Owner Dashboard

**User Story:** As a gym owner, I want a real-time analytics dashboard showing how my members are engaging with their plans, so that I can identify disengaged members early, demonstrate the value of my gym's PHYZIQ integration to prospects, and run targeted challenges.

#### Acceptance Criteria

1. THE Gym_Dashboard SHALL display the following metrics for the Gym_Owner's member cohort: total active Members, average plan completion rate (past 7 days), average weekly sessions logged, and top 5 exercises performed.
2. WHEN a Gym_Owner views the Gym_Dashboard, THE Platform SHALL present data no older than 1 hour from the current time.
3. WHEN the Gym_Owner selects a date range filter, THE Gym_Dashboard SHALL update all displayed metrics to reflect only activity within the selected range within 3 seconds.
4. THE Gym_Dashboard SHALL display a member engagement heatmap showing the distribution of workout session times across days of the week and hours of the day for the gym's cohort.
5. WHEN a Member linked to a gym has not logged any activity for 7 consecutive days, THE Platform SHALL flag that Member as "at risk of disengagement" in the Gym_Dashboard.
6. THE Gym_Dashboard SHALL generate a unique QR_Code for each gym partner, allowing the Gym_Owner to download the QR_Code as a PNG or PDF for physical display.
7. WHEN a Gym_Owner creates a cohort challenge (a shared goal with a start date, end date, and target metric), THE Platform SHALL enrol all consenting Members linked to that gym and display a live leaderboard on the Gym_Dashboard.
8. THE Gym_Dashboard SHALL NOT expose individual Member health data (NCD_Profile, biometric logs) to the Gym_Owner — only aggregate, anonymised cohort metrics SHALL be accessible.
9. WHEN the Gym_Owner requests a monthly engagement report, THE Platform SHALL generate and deliver a downloadable PDF report to the Gym_Owner's registered email within 60 seconds of the request.
10. THE Platform SHALL authenticate Gym_Owner access to the Gym_Dashboard using OTP-verified login and JWT-based session tokens with a maximum session duration of 8 hours.

---

### Requirement 8: Conversational AI Coach

**User Story:** As a member, I want to ask the AI coach questions about my plan — like why a certain exercise is included or how to handle a week where I'm travelling — and receive clear, contextual answers that reflect my actual plan data.

#### Acceptance Criteria

1. WHEN a Member submits a text query to the Conversational AI Coach, THE AI_Engine SHALL return a contextually relevant response referencing the Member's current Adaptive_Plan within 4 seconds on a standard 4G connection.
2. WHEN the Conversational AI Coach cannot answer a query with sufficient confidence (Confidence_Indicator below 60%), THE AI_Engine SHALL acknowledge the uncertainty and offer to connect the Member with a verified Coach from the marketplace.
3. WHEN a Member asks the Conversational AI Coach to modify their plan for a specific exception (e.g., "I'm travelling for 3 days with no gym access"), THE AI_Engine SHALL generate a modified plan variant for the exception period within 10 seconds and present it for Member approval before applying.
4. THE AI_Engine SHALL retain conversational context across the five most recent Member messages within a session, so that follow-up questions do not require re-stating prior context.
5. WHEN a Member approves a plan modification suggested by the Conversational AI Coach, THE Platform SHALL update the Adaptive_Plan and log the modification event with a timestamp and the triggering query.
6. THE AI_Engine SHALL NOT provide diagnoses, prescribe medication, or make statements that constitute medical advice — responses touching on health conditions SHALL include a referral to consult a qualified health professional.

---

### Requirement 9: Coach and Trainer Marketplace

**User Story:** As a gym member, I want to browse and book sessions with verified coaches and dietitians on the platform, so that I can get expert human guidance when AI coaching is not sufficient, with transparent and fair pricing.

#### Acceptance Criteria

1. THE Platform SHALL display verified Coach profiles including credentials, specialisation (personal training, dietetics, physiotherapy), rating (1–5 stars from previous Member reviews), availability calendar, and session fee in KES.
2. WHEN a Member books a session with a Coach, THE Platform SHALL deduct the session fee from the Member's chosen payment method, hold the funds in escrow, and release them to the Coach within 48 hours of the session's scheduled end time.
3. WHEN a session is completed, THE Platform SHALL prompt the Member to submit a rating (1–5 stars) and optional text review within 24 hours.
4. THE Platform SHALL charge a commission of between 10% and 15% of the Coach session fee on each completed booking, deducted from the funds released to the Coach.
5. WHEN a Coach completes identity and credential verification (government ID + certified qualification document), THE Platform SHALL display a "Verified" badge on the Coach's profile.
6. IF a Member cancels a booking more than 24 hours before the scheduled session, THEN THE Platform SHALL issue a full refund to the Member's original payment method within 5 business days.
7. IF a Member cancels a booking within 24 hours of the scheduled session, THEN THE Platform SHALL apply the cancellation policy specified on the Coach's profile (0%–50% refund) and notify both parties.
8. THE Platform SHALL display the commission rate and all deductions transparently to Coaches in their earnings dashboard before and after each transaction.

---

### Requirement 10: Offline-First and Low-Bandwidth Architecture

**User Story:** As a member in an area with intermittent internet connectivity, I want to view my current plan and log workouts even when I'm offline, so that connectivity issues don't block my training routine.

#### Acceptance Criteria

1. WHEN a Member opens the Platform application with no network connectivity, THE Platform SHALL display the Member's most recently synced Adaptive_Plan from the Offline_Cache with zero additional loading time beyond app launch.
2. WHILE the Platform is operating in offline mode, THE Platform SHALL allow the Member to log workout sets and meal entries, storing all data in the Offline_Cache.
3. WHEN network connectivity is restored, THE Platform SHALL synchronise all Offline_Cache entries to the server in the background without requiring Member interaction, within 5 minutes of connectivity detection.
4. IF a sync conflict is detected (the same log entry was modified both locally and server-side), THEN THE Platform SHALL retain the locally modified version and flag the conflict for the Member to resolve.
5. THE Platform SHALL limit the Offline_Cache size to a maximum of 30 days of plan and log data per Member to manage device storage responsibly.
6. THE Platform SHALL compress all API responses exceeding 10 KB using gzip or Brotli encoding to minimise data transfer costs for Members on metered mobile data connections.
7. WHEN a Member is on a low-bandwidth connection (detected throughput below 256 kbps), THE Platform SHALL serve low-resolution images and defer non-essential background data fetches.

---

### Requirement 11: Authentication and Data Privacy

**User Story:** As a member, I want my account and health data to be secure and private, and I want to know that the platform complies with Kenyan data protection law, so that I can trust PHYZIQ with sensitive health information.

#### Acceptance Criteria

1. THE Platform SHALL authenticate Members using OTP delivered via SMS or WhatsApp, issuing a JWT access token valid for 24 hours and a refresh token valid for 30 days upon successful verification.
2. THE Platform SHALL store all Health_Data_Store records in a separate database partition with access control policies that restrict access to authorised AI_Engine service accounts and the Member themselves.
3. THE Platform SHALL obtain explicit, granular informed consent from each Member for: (a) general profile data processing, (b) health data processing (NCD_Profile, biometrics), and (c) anonymised data use for AI model improvement — each consent independently revocable.
4. WHEN a Member withdraws consent for health data processing, THE Platform SHALL delete the Member's NCD_Profile and biometric logs from the Health_Data_Store within 72 hours and confirm deletion to the Member.
5. THE Platform SHALL maintain a personal data register and complete ODPC registration before processing health data for more than 100 Members, in compliance with the Kenya Data Protection Act 2019.
6. THE Platform SHALL log all access events to the Health_Data_Store, recording the accessing service, timestamp, Member ID, and operation type, and retain these logs for a minimum of 12 months.
7. IF a data breach affecting Member personal data is detected, THEN THE Platform SHALL notify affected Members within 72 hours and report the breach to the ODPC within 72 hours of detection, as required by the Kenya Data Protection Act 2019.
8. THE Platform SHALL encrypt all personal data at rest using AES-256 and all data in transit using TLS 1.2 or higher.

---

### Requirement 12: Plan Export as Paid Artifact

**User Story:** As a paying member, I want to download my plan as a nicely formatted PDF or Word document, so that I have an offline reference I can use at the gym without needing the app open.

#### Acceptance Criteria

1. WHEN a Paid_Plan is unlocked after payment, THE Platform SHALL make available both a PDF and a DOCX version of the Member's full current Adaptive_Plan for download.
2. THE PDF and DOCX exports SHALL include: Member name, plan start date, full weekly workout schedule with sets/reps/rest periods, full weekly meal plan with portion sizes and macros, and a branded PHYZIQ header/footer.
3. WHEN a Member requests plan export, THE Platform SHALL generate the export file within 30 seconds.
4. WHEN the AI_Engine updates the Adaptive_Plan (e.g., after a workout log triggers progressive overload), THE Platform SHALL invalidate previously generated export files and make updated exports available for download within 30 seconds of the plan update.
5. THE Platform SHALL retain generated plan export files for a minimum of 90 days, allowing the Member to re-download without triggering regeneration.
6. FOR ALL exported plans, parsing the exported DOCX file and re-rendering it SHALL produce a document with equivalent content to the source plan record stored in the Platform's database (round-trip property for export correctness).

