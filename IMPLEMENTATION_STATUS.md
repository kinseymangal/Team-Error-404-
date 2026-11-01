# Latest AI segmentation update
The pretrained four-category model is included and active. Existing reports have a Run AI segmentation action. See README.md and TESTING.md for current status; older notes below are historical.

# Current viewer/disease update — read first

Latest implementation: three main tabs, SVG central image/boxes/crops/connectors, actual usable masks, four category toggles, explicit doctor annotation decisions, authorized approved reference cases, three disease modules with honest availability, and blue/yellow/red genuine model attention display. Exactly DR, Glaucoma and AMD are listed. Glaucoma/AMD models and soft-exudate weights are NOT configured. Existing low-quality masks are still suppressed. No clinical accuracy improvement is claimed.

Final executed checks: build passed; all 29 automated tests passed, including actual inference and authenticated MongoDB APIs. Full browser visual verification remains incomplete. README.md and TESTING.md describe the current state. Notes below are historical incremental records; where they conflict, this section and README take precedence.

# Implementation status — honest scope of this archive

## Implemented
- Existing five-class ONNX inference with five probabilities; explicit finite/five-output validation and per-image SHA-256 fingerprint.
- Maximum softmax score returned as `confidence`, explicitly uncalibrated. No claim of calibrated medical confidence.
- Corrected grayscale Grad-CAM rendering: prior resized output had 3 channels but was indexed as 1. Real existing activations and analytical classifier-head gradients remain in use.
- Original-image aspect ratio, transparent heatmap with opacity control and intensity legend.
- Segmentation tab, suppression of broad/suspicious masks, numbered candidate regions and saved reviewer-drawn annotations.
- Structured per-image bilingual guidance based on actual results and review notes. This is deterministic text, NOT an LLM integration.
- Browser-printable bilingual reports and original image references; no independent server PDF generator.
- Three official-source Indore hospital listings with contact/directions links. Appointment request records, manual hospital-confirmation records, follow-up and transport coordination.
- English/Hindi primary UI and persistent dark/light preference.
- Offline registration and persistent MongoDB case/transport records retained.
- Evaluation CLI with per-class precision/recall/F1, macro F1, confusion matrix, quadratic weighted kappa, rejection reporting, exact duplicate and supplied patient-group leakage checks.

## Not completed (do not infer otherwise)
- Patient and doctor registration/login, password reset, verified doctor approval, record ownership, consent-based doctor access, secure sessions and role-based authorization.
- Prescriptions, persistent notification/reminder scheduler, email delivery, separate role dashboards and clinical analytics.
- Automated de-identified verified datasets, dataset versioning, independent retraining, promotion approval and rollback.
- Independent five-class accuracy evaluation: no suitable independently labelled dataset supplied. Repeated grades may reflect model limitations; no predictions were artificially altered.
- Reliable lesion detection/segmentation weights or validated anatomy localization. Existing lesion weights have very low recorded development Dice. No retraining or accuracy improvement is claimed.
- LLM-generated constrained explanations and server-produced PDF exports.
- Expansion to 20–25 verified hospitals, database-managed directory, admin listing management, directory filters/maps/distance sorting.
- Live hospital booking integrations. A locally saved request does not transmit to a hospital, reserve a slot or confirm an appointment.
- Removal of Camp-to-Care/technical training controls. Existing functionality was preserved pending secure replacement workflows.
- Full security, mobile, theme and browser visual verification. Do not deploy for real patients.

## Inputs still needed for those modules
- Independently labelled retinal test data and credible trained localization weights (with licences/provenance).
- Previously mentioned anatomy reference image (not present in this chat's available attachments).
- Email/password-reset delivery configuration, LLM provider credentials, doctor-verification authority/process and hospital integration agreements where applicable.

## Validation record
Previous core update: 20 executed tests passed, including real ONNX inference and MongoDB appointment/annotation/transport workflows. Production build passed.
This master-request increment: production build and metrics/registration/report unit tests executed; see TESTING.md for exact result. Full clinical accuracy, security and browser end-to-end testing have NOT been established.

Original archive backup preserved separately in the working workspace. Real patient data, uploads, private .env, runtime databases and node_modules are excluded from this deliverable.


## Latest security increment
Implemented patient/doctor registration and login, scrypt password hashing, HttpOnly same-site sessions, logout, patient ownership checks, per-image authorization, verified-doctor restrictions, patient-controlled doctor access/revocation, and administrator-only doctor verification. Existing unowned records remain accessible only to administrators; no patient data was deleted. Legacy sync and automatic offline queue replay are disabled until account-aware workflows are implemented. Training navigation is removed; training API is administrator-only.

The UI is still a shared workspace with login and role enforcement, not completed separate role dashboards. Transport grouping is now administrator-only; ordinary accounts may see an access-denied message there. Password reset/profile management, prescriptions, notification/reminder scheduling, verified dataset automation, LLM reports, expanded hospital directory and validated model upgrades remain unfinished. This archive does not satisfy all 18 modules.

Executed validation for this increment: production build passed; security integration test passed against temporary MongoDB. The test checked anonymous rejection, cross-patient isolation, doctor verification, explicit patient grant, prohibited patient review/admin actions and session invalidation after logout. Older unauthenticated integration tests need migration to the new authentication flow; do not treat `npm test` as fully passing in this increment. This is not a completed security audit or clinical validation.

Administrator setup: configure MONGODB_URI and temporary ADMIN_EMAIL/ADMIN_PASSWORD (12+ characters) in the terminal environment and run `node scripts/create-admin.mjs`. Clear ADMIN_PASSWORD afterward. Administrator must independently verify a doctor's registration before calling POST /api/auth/doctors/:id/verify with {"verified":true} using an authenticated administrator session. Never automatically approve doctors. No verification UI or password-reset email delivery is configured yet.

Run: extract, open NayanSetu-MERN, run `npm.cmd ci`, then `npm.cmd run dev`, open http://127.0.0.1:5173 and create an account. Existing .env, .runtime, uploads and data folders must be preserved when merging into the old project. Account ownership is intentionally not guessed for old cases. Deployed HTTPS is required for production secure cookies.


## Latest prescription and notification increment
Implemented doctor-issued prescriptions (medicine, dosage, frequency, duration, instructions, clinical observations and follow-up date), immutable prescription history, issuing-doctor-only discontinuation with reason, and browser print/save-as-PDF. Issuance requires a verified doctor, current patient authorization and a review by that doctor. Patients only access their own case prescriptions. Prescription records are embedded in MongoDB cases and are included in the case export. Notifications persist in a separate MongoDB collection with recipient-scoped reading and read status. Issuing a prescription creates a patient notification; the header shows unread count and polls every 30 seconds.

Production build passed. The executed temporary-MongoDB security integration test additionally verified patient issuance rejection, review requirement, valid authorized doctor issuance, isolation of notifications, recipient-only mark-as-read, patient discontinuation rejection and issuing-doctor discontinuation persistence.

Not added in this increment: automatic medication/appointment reminders, email delivery, prescription editing (discontinue and issue a replacement instead), notification preferences, other notification triggers, server-generated PDF files. Notification history is not included in the legacy JSON export. Full role dashboard redesign, other previously listed unfinished modules and full browser visual verification remain outstanding.


## Latest report-sharing workflow fix
Added prominent sharing controls on Image reports and patient Doctor review, explicit bulk sharing of all currently owned reports to one verified doctor, automatic first-case selection, polling of doctor verification, administrator verification UI and configured administrator bootstrap/startup script. Review completion now opens Prescriptions. Notifications cover report sharing, screening completion, doctor review, prescription issue and discontinuation. Account isolation remains enforced.

Executed test: real authenticated temporary-MongoDB flow with administrator API doctor verification, patient sharing, doctor listing of two reports, actual review API call, prescription issue/discontinuation, notification ownership and unrelated-patient denial. Test passed; production build passed. No full visual/browser verification claim. See DOCTOR REVIEW WORKFLOW.md.
