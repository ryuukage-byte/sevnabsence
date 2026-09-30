# 07_TESTING.md — Comprehensive Test Plan & QA Protocols

**Document Version:** 1.0  
**Scope:** Functional Verification, Security & Permission Hardening, Duplicate Prevention, Tablet & PWA Validation  

---

## 1. Test Strategy Overview

The testing strategy guarantees that the attendance system is **rock-solid in reliability**, **immune to tampering or duplicate entries**, and **smooth on physical tablet hardware**.

```
                +-----------------------------------------+
                |        QA Testing Pyramid               |
                +-----------------------------------------+
                | [E2E] Tablet Kiosk & Scan Flow           |
                +-----------------------------------------+
                | [Integration] RPC Stored Procedures      |
                |   - Shift tolerances & Grace periods    |
                |   - Anti-proxy audit & corrections      |
                +-----------------------------------------+
                | [Security & Permissions] RLS & Tenancy   |
                |   - Multi-tenant data leakage checks    |
                |   - Member self-access boundaries       |
                +-----------------------------------------+
                | [Database Concurrency] Duplicate Guard   |
                |   - Parallel scan race conditions       |
                +-----------------------------------------+
```

---

## 2. Functional Test Cases

### 2.1 Check-In (MASUK) Test Matrix

| Test ID | Test Scenario | Inputs / Pre-conditions | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-IN-01** | Standard On-Time Check-In | Member has Shift A (08:00–17:00). Scans at 07:55. | Record inserted. Status: `PRESENT`, `late_minutes = 0`. Feedback: "Berhasil!". | [ ] |
| **TC-IN-02** | Check-In within Late Tolerance | Shift A (08:00–17:00, 10 min tolerance). Scans at 08:07. | Record inserted. Status: `PRESENT`, `late_minutes = 0`. | [ ] |
| **TC-IN-03** | Check-In beyond Late Tolerance | Shift A (08:00–17:00, 10 min tolerance). Scans at 08:18. | Record inserted. Status: `LATE`, `late_minutes = 18`. UI notes late arrival. | [ ] |
| **TC-IN-04** | Early Arrival Check-In | Shift A (08:00–17:00, early tolerance 30m). Scans at 07:40. | Record inserted. `early_arrival_minutes = 20`. Status: `PRESENT`. | [ ] |
| **TC-IN-05** | Check-In on Scheduled Day Off | Schedule for today is marked `OFF`. Scans card. | Scan rejected. Message: *"Hari ini dijadwalkan: OFF. Tidak perlu presensi."* | [ ] |
| **TC-IN-06** | Check-In on Approved Leave | Schedule for today is marked `LEAVE`. Scans card. | Scan rejected. Message: *"Hari ini dijadwalkan: LEAVE."* | [ ] |

### 2.2 Check-Out (PULANG) Test Matrix

| Test ID | Test Scenario | Inputs / Pre-conditions | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-OUT-01**| Check-Out without Prior Check-In | Member did not scan `MASUK` today. Scans `PULANG`. | Scan rejected. Code: `NO_CHECK_IN_FOUND`. Message: *"Belum bisa pulang. Belum ada catatan masuk."* | [ ] |
| **TC-OUT-02**| Valid Check-Out | Member checked in at 07:55. Scans `PULANG` at 17:05. | Record updated. `check_out_at` saved. `work_duration_minutes` computed. Goodbye feedback. | [ ] |
| **TC-OUT-03**| Early Check-Out | Member checks out at 15:30 (Shift ends 17:00). | Record updated. Early departure noted in logs. | [ ] |
| **TC-OUT-04**| Overtime Check-Out | Member checks out at 18:30 (Shift ends 17:00). | Record updated. Work duration stored; not auto-approved as paid overtime. | [ ] |

---

## 3. Duplicate Attendance Protection & Concurrency Testing

Preventing duplicate check-in/check-out records is a **mandatory zero-defect requirement**.

| Test ID | Test Scenario | Method / Execution | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-DUP-01**| Rapid Double Tap on Kiosk | User scans QR card, and within 300ms scans again. | 1st scan succeeds. 2nd scan returns `DUPLICATE_CHECK_IN`. Exactly 1 database record exists. | [ ] |
| **TC-DUP-02**| Concurrent Multi-Device Scan | Two kiosks simultaneously submit `MASUK` for the same member token in parallel. | Postgres `UNIQUE (organization_id, member_id, attendance_date)` blocks parallel insertion; exactly 1 transaction commits. | [ ] |
| **TC-DUP-03**| Duplicate Check-Out Attempt | User checks out at 17:00, then scans `PULANG` again at 17:05. | 2nd scan returns `DUPLICATE_CHECK_OUT` ("Sudah presensi pulang pada 17:00"). Database unchanged. | [ ] |
| **TC-DUP-04**| Alternating Action Attack | User scans MASUK -> PULANG -> MASUK again on same day. | 2nd MASUK is rejected because attendance row for today already exists. | [ ] |

---

## 4. QR Token Security & Lifecycle Testing

| Test ID | Test Scenario | Steps | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-QR-01** | Revoked QR Card Usage | Admin revokes Token A in admin portal. User scans Token A. | Scan rejected. Code: `INVALID_QR`. Message: *"Kartu QR tidak dikenali atau telah dinonaktifkan."* | [ ] |
| **TC-QR-02** | Replacement QR Card | Admin issues replacement Token B to member. User scans Token B. | Scan succeeds under the member's profile. | [ ] |
| **TC-QR-03** | Arbitrary / Malformed Token | Attacker generates QR with text `"random_attacker_string"`. | Scan rejected. Code: `INVALID_QR`. No database changes. | [ ] |
| **TC-QR-04** | QR Content Privacy Check | Decode QR image with standard third-party phone camera reader. | Displays opaque string (e.g. `tok_98fbc...`). Zero personal names, emails, or IDs exposed. | [ ] |

---

## 5. Security & Permission Testing (RLS & Tenancy)

| Test ID | Test Scenario | Attack / Action | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-SEC-01**| Cross-Tenant Member Leak | Admin from Organization 1 queries members table via Supabase API with `organization_id = Org 2`. | Returns 0 rows. Blocked by PostgreSQL RLS. | [ ] |
| **TC-SEC-02**| Member Reading Other Records | Member logged into Portal tries `SELECT * FROM attendance`. | RLS filters result to only rows where `member_id = auth.member_id`. Other employees hidden. | [ ] |
| **TC-SEC-03**| Direct Attendance Table Write | Non-admin client attempts direct `INSERT INTO attendance` bypassing RPC. | Denied by Postgres RLS permissions. All kiosk scans must pass through `record_attendance_scan()`. | [ ] |
| **TC-SEC-04**| Client Clock Manipulation | User changes tablet system time backwards by 2 hours. | Scan timestamp recorded in database strictly matches PostgreSQL server clock (`NOW()`). | [ ] |

---

## 6. Anti-Proxy Review & Audit Log Testing

| Test ID | Test Scenario | Steps | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-AUD-01**| Manual Timestamp Correction | Admin alters Musa's check-in from 08:30 to 08:00 with reason "Lupa bawa kartu". | - `attendance.status` updated to `CORRECTED`.<br>- Row inserted to `attendance_corrections` with previous & new values, admin ID, and reason.<br>- Original record traceable in audit log. | [ ] |
| **TC-AUD-02**| Anti-Proxy Flagging | Admin flags suspicious record as `FLAGGED_INVALID`. | Record is marked for review; scan record is never silently deleted. | [ ] |
| **TC-AUD-03**| Schedule Change Audit | Admin reassigns shift on schedule grid. | Event logged to `audit_logs` with actor ID, target date, and shift change details. | [ ] |

---

## 7. Tablet Hardware & PWA Test Suite

| Test ID | Test Scenario | Hardware / Environment | Expected Result | Pass/Fail |
|---|---|---|---|---|
| **TC-TAB-01**| Front-Camera Defaulting | Apple iPad 10.2" (Safari) / Samsung Galaxy Tab (Chrome) | Video stream defaults to front-facing camera without manual camera switcher. | [ ] |
| **TC-TAB-02**| Mirror Video Feed | Tablet in landscape stand facing user. | Video is horizontally mirrored (`scaleX(-1)`); moving badge right moves it right on screen. | [ ] |
| **TC-TAB-03**| PWA Standalone Mode | "Add to Home Screen" on iPad / Android. | App launches without browser URL bar, tabs, or navigation chrome. | [ ] |
| **TC-TAB-04**| Touch Target Usability | Operator taps `[ MASUK ]` / `[ PULANG ]` with one finger. | Target is >= 64px height; no accidental mis-taps; responsive hover/active ripple. | [ ] |
| **TC-TAB-05**| Network Loss Handling | Disconnect Wi-Fi on tablet while app is open. | Scanner pauses, displays amber connectivity warning: *"Koneksi terputus"*. Reconnects automatically when Wi-Fi resumes. | [ ] |
| **TC-TAB-06**| Low-Light Camera Scan | Dim lighting condition (100–150 lux). | QR code still decodes within 1.5 seconds under high contrast badge printing. | [ ] |
