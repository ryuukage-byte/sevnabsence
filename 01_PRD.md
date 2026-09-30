# 01_PRD.md — Product Requirements Document

**Project:** Web-Based Employee Attendance System  
**Product Name:** [Flexible Business Name] Attendance Platform  
**Version:** MVP v1.0  
**Status:** Planning / Ready for Implementation  
**Target Platform:** Web (Responsive Desktop, Mobile) & Tablet PWA (Kiosk Mode)  

---

## 1. Executive Summary & Vision

The system is a lightweight, intuitive, and secure web-based attendance system designed for businesses, branch offices, clinics, community centers, and small-to-medium organizations.

Traditional enterprise HR and attendance software is notoriously cluttered, slow, rigid, expensive, and intimidating for daily workers. This product solves that problem with a **friendly, tablet-optimized, QR-based kiosk attendance experience** paired with an **approachable yet powerful administrative back-office** in a single unified web application.

### Core Philosophy
- **Friendly & Approachable:** Eliminates sterile corporate feel through soft visual design, reassuring feedback, and light micro-animations.
- **Reliable & Tamper-Resistant:** Attendance logic and timestamps are 100% server-enforced; QR codes contain opaque tokens without personal data; duplicate scans are blocked at the database level.
- **Hardware-Agnostic & Low-Cost:** Runs on commodity tablets (iPads, Android tablets, laptops) via Progressive Web App (PWA) using the front-facing camera.
- **Zero AI Dependency:** Predictable, robust business rules for shifts, tolerances, late arrivals, and reporting without costly or erratic AI APIs.

---

## 2. Target Personas & User Roles

### 2.1 Persona 1: Member / Employee (Rudi)
- **Profile:** Frontline staff, shift worker, nurse, retail clerk, or field employee.
- **Needs:**
  - Fast check-in (`Masuk`) and check-out (`Pulang`) without manual typing.
  - Clear, immediate feedback confirming their scan.
  - Ability to check personal monthly work schedule and shifts on their smartphone.
  - Ability to check their own historical attendance records and statuses.
- **Pain Points:** Complex login screens, laggy camera scanners, ambiguous confirmation of whether attendance was logged.

### 2.2 Persona 2: Administrator / Branch Manager (Siti)
- **Profile:** Branch manager, supervisor, or HR coordinator managing 10 to 200 staff.
- **Needs:**
  - Live "Today" dashboard showing who is present, late, on leave, or missing.
  - Flexible shift configuration (start, end, early arrival tolerance, grace periods).
  - Intuitive monthly schedule grid where members can be assigned shifts, rest days (OFF), or leaves.
  - Ability to generate, print, replace, or revoke QR cards.
  - Attendance correction tools with mandatory audit trails (who edited, when, and why).
  - Anti-proxy review workflow to flag and verify suspicious scans.
  - Simple 1-click CSV report export for payroll or records.
- **Pain Points:** Time theft, proxy scanning (buddy punching), lost QR cards, accidental double scans, cumbersome scheduling spreadsheets.

---

## 3. High-Level System Architecture & Modes

The application runs as a **single unified web application** serving two distinct user experiences determined by authentication and routing:

```
                               +----------------------------+
                               |     Unified Web App        |
                               +--------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         +-----------v-----------+                         +-----------v-----------+
         |     Kiosk / Member    |                         |      Admin Mode       |
         |         Mode          |                         |                       |
         +-----------------------+                         +-----------------------+
         | - Kiosk Front Camera  |                         | - Today Dashboard     |
         |   QR Scanner          |                         | - Member Management   |
         | - Quick MASUK/PULANG  |                         | - Shift Configuration |
         | - Member Dashboard    |                         | - Monthly Schedule    |
         | - Schedule & History  |                         | - Attendance Logs     |
         +-----------------------+                         | - Audit & Reviews     |
                                                           | - Reports & Export    |
                                                           +-----------------------+
```

---

## 4. Key Functional Features & Scope (MVP v1.0)

### 4.1 Kiosk & QR Scanning Mode (`/attendance`)
- **Front-Camera Default:** Opens the tablet's front-facing camera directly; users approach the tablet on a stand without needing to rotate it.
- **Action Selection:** Large, distinct buttons for `[ MASUK ]` (Check-in) and `[ PULANG ]` (Check-out).
- **Instant Scan Detection:** Responsive optical QR scanning via HTML5 video stream, parsing opaque cryptographic tokens.
- **Server Verification:** Token is dispatched to the backend API; client clocks are never trusted.
- **Audio/Visual Feedback:**
  - Success: Cheerful affirmation, member name, action, exact timestamp.
  - Duplicate: Friendly warning ("Sudah tercatat — You have already checked in today").
  - Invalid / Revoked: Helpful prompt ("QR tidak dikenali — Hubungi administrator").
  - State Error: Contextual warning ("Belum bisa pulang — Belum ada data masuk").

### 4.2 Member Portal (`/member`)
- **Secure Member Login:** Email/password or PIN-based authentication.
- **Personal Dashboard:**
  - Member name, position, department, organization name.
  - Today's date, assigned shift, and expected work hours.
  - Live attendance status for today (Not Yet In, Present, Checked Out, On Leave).
  - Registered check-in and check-out timestamps.
- **Personal Schedule View:** Calendar/list view showing shift assignments and scheduled days off.
- **Personal History:** Filterable historical log of past attendance records. Data isolation guarantees members cannot access colleagues' records.

### 4.3 QR Identity Lifecycle
- **Opaque Token Design:** QR codes contain only a cryptographically random UUID token (e.g., `qr_tok_9f8a3c2...`). No personal data (name, email, ID) is stored inside the barcode.
- **Card Generation & Download:** Admin can view, preview, and print/download branded printable QR ID badges.
- **Revocation & Replacement:** If a physical card is lost or compromised, Admin can revoke the token with 1 click and issue a fresh replacement immediately. The old QR becomes instantaneously invalid.

### 4.4 Shift Management & Tolerance Engine
- **Configurable Shifts:** Admins can define unlimited shifts (e.g., Shift A: 08:00–17:00, Shift B: 09:00–18:00, Night Shift: 20:00–05:00).
- **Grace Periods & Tolerances:**
  - *Early Check-in Window:* (e.g., up to 60 mins before start).
  - *Late Tolerance / Grace Period:* (e.g., 10 minutes past start time counts as on-time).
  - *Late Calculation:* Exact late minutes computed and stored relative to schedule (`actual_time - scheduled_start`).
  - *Overtime Threshold:* Minutes worked past scheduled end recorded as extra duration without automatically presuming official payroll overtime.

### 4.5 Monthly Scheduling Grid (`/admin/schedule`)
- **Matrix View:** Intuitive spreadsheet-like grid:
  - **Rows:** Members/Employees.
  - **Columns:** Days of selected month (1..31).
  - **Cells:** Interactive shift selector pills (`Shift A`, `Shift B`, `OFF`, `LEAVE`, `SICK`, `HOLIDAY`).
- **Bulk Shift Assignment:** Quickly fill weekday defaults or apply recurring patterns across teams.
- **Day Off & Holiday Definition:** Mark company-wide or branch-wide holidays.

### 4.6 Today Monitoring Dashboard (`/admin`)
- **Real-Time Counters:**
  - Total Scheduled for Today
  - Checked In (Present)
  - Checked Out
  - Not Yet Arrived
  - Late Arrivals (with drill-down)
  - Approved Leaves / Sick
  - Attendance Requiring Review
- **Live Activity Feed:** Feed of the latest scan events across the organization.

### 4.7 Attendance History, Corrections & Anti-Proxy Review (`/admin/attendance`)
- **Filterable Records:** Filter by Date Range, Department, Member, Shift, and Status.
- **Correction Workflow:**
  - Admin can adjust timestamps (e.g., employee forgot to check out).
  - Database stores original timestamp, updated timestamp, editor ID, edit timestamp, and mandatory change reason.
- **Anti-Proxy Review:**
  - Flags suspicious scans (e.g., unusual scan times, proxy alerts).
  - Admin can mark record as `REVIEW_REQUIRED`, `VERIFIED`, or `FLAGGED_INVALID`.
  - Scans are never permanently erased without a trace; original records remain in the audit log.

### 4.8 Reports & CSV Export (`/admin/reports`)
- **Summary Metrics:** Total scheduled days, working days, total late minutes, absenteeism rate, incomplete records.
- **Export Capabilities:** 1-click clean CSV export formatted for standard spreadsheet and payroll import tools.

### 4.9 Multi-Organization / Multi-Branch Readiness
- System model includes `organization_id` on all major tables.
- Organization profiles support flexible branding: Company Name, Branch Name, and custom Display Name (e.g., "ABC Health — Shimada Clinic").

---

## 5. Non-Goals for MVP v1.0

The following features are **explicitly excluded** from MVP v1.0 to ensure timely delivery, rock-solid stability, and zero unnecessary operational overhead:
1. **No Artificial Intelligence:** No AI chatbots, computer vision facial recognition, or ML predictive scheduling.
2. **No Complex Payroll Engine:** Attendance timestamps and calculated late/work hours are exported to CSV; tax, insurance, deductions, and salary disbursement remain in external payroll software.
3. **No Biometric Hardware Integration:** No fingerprint scanners or dedicated NFC readers.
4. **No Automated Push/SMS/WhatsApp Blasts:** Notifications can be evaluated post-MVP; MVP relies on live web dashboards and alerts.
5. **No Offline Fake Timestamping:** Kiosk scans require connectivity so the backend can issue authentic server-side timestamps.

---

## 6. Success Metrics & Acceptance Criteria

| ID | Criteria | Target |
|---|---|---|
| **AC-01** | Scan to confirmation latency | < 1.5 seconds on typical 4G / Wi-Fi |
| **AC-02** | Duplicate check-in prevention | 100% blocked at database level within the same shift/date |
| **AC-03** | Server timestamp integrity | Client local time has 0% influence on attendance record |
| **AC-04** | QR Token revocation | Instant invalidation; old token rejected immediately |
| **AC-05** | Schedule modification ease | Admins can reassign shifts in < 3 clicks per cell |
| **AC-06** | Data isolation (Tenancy & Role) | Members cannot read other members' data; tenants cannot view cross-org data |
| **AC-07** | Tablet usability | Full scan flow operated touch-free via front camera after MASUK/PULANG selection |
| **AC-08** | Audit completeness | 100% of attendance edits record who, when, previous value, and reason |
