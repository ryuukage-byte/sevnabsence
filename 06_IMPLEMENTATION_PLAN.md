# 06_IMPLEMENTATION_PLAN.md — Development Phases & Milestone Roadmap

**Product:** Web-Based Employee Attendance System  
**Version:** MVP v1.0  
**Methodology:** Incremental Agile Delivery (Phased Implementation)  

---

## 1. Implementation Phases & Roadmap

```
Phase 1: DB & Auth Setup
   │
   ▼
Phase 2: Design System & UI Shell
   │
   ▼
Phase 3: Kiosk Scanner Engine (Front Camera + QR)
   │
   ▼
Phase 4: Attendance Rules Engine & Duplicate Guard
   │
   ▼
Phase 5: Member Portal (Dashboard, Schedule, History)
   │
   ▼
Phase 6: Admin Management (Today, Members, Shifts)
   │
   ▼
Phase 7: Monthly Scheduling Matrix Grid
   │
   ▼
Phase 8: Corrections, Anti-Proxy Audit & CSV Export
   │
   ▼
Phase 9: PWA Tablet Optimization & Quality Assurance
```

---

## 2. Detailed Task Breakdown by Phase

### Phase 1: Foundation, Database & Authentication
- **Task 1.1:** Initialize project repository (Vite + React + TypeScript + Lucide React).
- **Task 1.2:** Write and run database migration script on Supabase:
  - Create tables: `organizations`, `app_users`, `members`, `qr_tokens`, `shifts`, `schedules`, `attendance`, `attendance_corrections`, `audit_logs`.
  - Apply unique constraints (`organization_id`, `member_id`, `attendance_date`).
  - Configure indexes and foreign key cascades.
- **Task 1.3:** Configure Supabase Client and Auth helpers.
- **Task 1.4:** Seed initial organization ("ABC Care — Shimada Branch"), sample shifts (Shift A, B, C), and demo accounts (Admin and Members).
- **Deliverable:** Working database with RLS policies, functional authentication for Admin and Member roles.

---

### Phase 2: Design System & Shared Layout Shells
- **Task 2.1:** Implement `tokens.css` with friendly color palette, typography, shadows, and radii.
- **Task 2.2:** Build reusable UI atoms:
  - Button (`primary`, `secondary`, `masuk-emerald`, `pulang-coral`).
  - Badge & Status pill (`PRESENT`, `LATE`, `LEAVE`, `OFF`).
  - Card & Modal dialog components.
  - Live Digital Clock component with seconds display.
- **Task 2.3:** Implement Mascot / Character micro-animation component (`KojiMascot`) supporting states: `idle`, `scanning`, `validating`, `success`, `duplicate`, `error`.
- **Task 2.4:** Build App Shells:
  - Kiosk Header (Business display name + Clock).
  - Admin Layout (Sidebar navigation + Topbar).
  - Member Mobile Shell (Bottom navigation bar).
- **Deliverable:** Visually cohesive, responsive UI shell reflecting the soft, friendly aesthetic.

---

### Phase 3: Kiosk Front-Camera Scanner Engine (`/attendance`)
- **Task 3.1:** Implement `CameraViewfinder` component using Web `MediaDevices.getUserMedia` defaulting to `{ facingMode: 'user' }`.
- **Task 3.2:** Apply CSS horizontal mirror transform (`scaleX(-1)`) for natural kiosk mirror experience.
- **Task 3.3:** Integrate QR barcode decoding library (`html5-qrcode` or `@zxing/library`).
- **Task 3.4:** Build Action Mode Selector: Big `[ MASUK ]` and `[ PULANG ]` touch-friendly buttons.
- **Task 3.5:** Construct Feedback Overlay:
  - Cheerful success card displaying Member Name, Action, Server Time, and Shift Status.
  - Friendly error card displaying contextual messages ("QR tidak dikenali", "Sudah tercatat", "Belum bisa pulang").
  - 3-second auto-reset countdown timer.
- **Deliverable:** Standalone tablet kiosk scanning experience operating smoothly on front camera.

---

### Phase 4: Core Attendance Rules Engine & Stored Procedure
- **Task 4.1:** Write and verify PostgreSQL atomic stored procedure `record_attendance_scan(p_token, p_action)`.
- **Task 4.2:** Enforce server-side timestamping using PostgreSQL `NOW()`.
- **Task 4.3:** Enforce shift tolerance calculations:
  - Compare scan time against shift start time.
  - Mark `PRESENT` if within grace period (`late_tolerance_mins`).
  - Mark `LATE` and compute `late_minutes` if after grace period.
- **Task 4.4:** Enforce checkout rules:
  - Block checkout if no check-in exists for today.
  - Block duplicate checkout if already logged.
  - Calculate `work_duration_minutes`.
- **Task 4.5:** Database concurrency and idempotency testing against duplicate scans.
- **Deliverable:** Bulletproof backend attendance processing immune to client clock tampering and race conditions.

---

### Phase 5: Member Portal (`/member`)
- **Task 5.1:** Member Home Dashboard:
  - Greeting with member name and organization.
  - Today's date, assigned shift, and live attendance status badge.
  - Recorded check-in and check-out timestamps.
- **Task 5.2:** Personal Monthly Schedule:
  - Calendar/grid showing assigned shifts, rest days (OFF), and holidays.
- **Task 5.3:** Personal Attendance History:
  - Table/list of past attendance with date, check-in, check-out, status, and late minutes.
- **Deliverable:** Complete self-service portal for staff to view schedules and attendance records.

---

### Phase 6: Admin Management Console (`/admin`)
- **Task 6.1:** Today Overview Dashboard:
  - Real-time counters: Scheduled, Checked In, Checked Out, Not Arrived, Late, Leave, Review Needed.
  - Activity feed of today's latest scans.
- **Task 6.2:** Member Management (`/admin/members`):
  - Member table with search and department filtering.
  - Create / Edit / Disable member modal.
  - Printable QR ID Badge Generator (renders high-res QR card on canvas with member name).
  - Token Revocation & Replacement flow.
- **Task 6.3:** Shift Configuration (`/admin/shifts`):
  - Shift listing (Shift A, Shift B, Night Shift).
  - Add/Edit shift form (start time, end time, early tolerance, late tolerance, color badge).
- **Deliverable:** Full operational management of personnel, shifts, and QR identities.

---

### Phase 7: Monthly Scheduling Matrix Grid (`/admin/schedule`)
- **Task 7.1:** Build monthly matrix component:
  - Sticky left column for Employee Names.
  - Header row for days of the selected month (1..31).
  - Color-coded shift pills inside cells.
- **Task 7.2:** Quick Cell Edit Popover:
  - Click cell -> popover menu (`Shift A`, `Shift B`, `OFF`, `LEAVE`, `SICK`, `HOLIDAY`).
  - Optimistic UI updates with instant database upsert.
- **Task 7.3:** Bulk Assignment Toolbar (fill whole month or weekdays with a chosen shift).
- **Deliverable:** Fast, intuitive scheduling interface replacing spreadsheets.

---

### Phase 8: Review, Corrections, Audit Logs & CSV Export
- **Task 8.1:** Attendance History Log (`/admin/attendance`):
  - Filters by date range, department, member, shift, and status.
- **Task 8.2:** Manual Attendance Correction Dialog:
  - Adjust check-in or check-out timestamps.
  - Mandatory audit reason field.
  - Inserts row to `attendance_corrections` and updates status to `CORRECTED`.
- **Task 8.3:** Anti-Proxy Review Workflow:
  - Queue of suspicious records.
  - Mark as `VERIFIED` or `FLAGGED_INVALID` without deleting historical record.
- **Task 8.4:** Reports & CSV Export (`/admin/reports`):
  - Summary metrics (attendance percentage, total late minutes).
  - Clean CSV export formatted for Excel and payroll imports.
- **Deliverable:** Complete compliance, auditability, and reporting tooling.

---

### Phase 9: PWA Configuration & Tablet Optimization
- **Task 9.1:** Generate Web App Manifest (`manifest.json`) and app icons (192px, 512px).
- **Task 9.2:** Configure Workbox Service Worker for offline app shell caching.
- **Task 9.3:** Tablet Kiosk optimization (prevent double-tap zoom, lock viewport, support standalone mode).
- **Task 9.4:** End-to-end integration and smoke testing.
- **Deliverable:** Production-ready PWA deployable to Vercel and installable on tablets.

---

## 3. Milestone Schedule & Dependencies

| Milestone | Deliverables Included | Prerequisite |
|---|---|---|
| **M1: Database & Auth Engine** | Schema, migrations, RLS, seed data | None |
| **M2: Kiosk Scan Prototype** | Front-camera scanner, MASUK/PULANG flow, UI feedback | M1 |
| **M3: Business Logic & Duplicate Shield** | Atomic scan RPC, shift tolerance rules, duplicate prevention | M1, M2 |
| **M4: Member Portal** | Member dashboard, personal schedule & history | M1, M3 |
| **M5: Admin Operations** | Today dashboard, Member CRUD, QR badge printing & revocation, Shift manager | M1, M3 |
| **M6: Schedule Matrix Grid** | Interactive monthly roster grid | M5 |
| **M7: Audit, Corrections & Reports** | Anti-proxy reviews, correction audit log, CSV exporter | M5, M6 |
| **M8: PWA & Tablet Launch** | PWA service worker, tablet kiosk hardening, QA sign-off | M2, M4, M7 |
