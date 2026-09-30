# 03_DATABASE.md — Database Architecture & Schema Specification

**Target Database:** PostgreSQL 15+ (Supabase)  
**Schema Model:** Multi-Tenant via `organization_id`  
**Security Model:** Row-Level Security (RLS) + Atomic Stored Functions (RPC)  

---

## 1. Entity-Relationship Overview

```
 organizations (1)
       |
       +---> (N) users (admins & members login)
       |
       +---> (N) members (employee profiles)
       |          |
       |          +---> (N) qr_tokens (opaque random tokens)
       |          |
       |          +---> (N) schedules (monthly shift assignments)
       |          |          |
       |          +----------+---> (N) attendance (daily records)
       |                                |
       |                                +---> (N) attendance_corrections (audit trail)
       |
       +---> (N) shifts (configurable shift templates & tolerances)
       |
       +---> (N) audit_logs (historical admin actions)
```

---

## 2. DDL Schema Definition (PostgreSQL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ORGANIZATIONS (Multi-Tenancy Root)
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150),
    display_name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. USERS (Application Accounts / Supabase Auth Mapping)
-- ============================================================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. MEMBERS (Staff / Employees)
-- ============================================================================
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL, -- Optional if member doesn't log in
    member_number VARCHAR(50), -- Optional employee badge number
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_member_org_number UNIQUE (organization_id, member_number)
);

-- ============================================================================
-- 4. QR_TOKENS (Opaque Identifiers for Contactless Attendance)
-- ============================================================================
CREATE TABLE qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_value VARCHAR(128) UNIQUE NOT NULL, -- Cryptographically random string (e.g. 'tok_' || encode(gen_random_bytes(24), 'hex'))
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT
);

-- ============================================================================
-- 5. SHIFTS (Work Schedules & Tolerances)
-- ============================================================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,            -- e.g. "Shift Pagi (Shift A)"
    code VARCHAR(10) NOT NULL,             -- e.g. "A"
    start_time TIME NOT NULL,              -- e.g. "08:00:00"
    end_time TIME NOT NULL,                -- e.g. "17:00:00"
    early_tolerance_mins INT DEFAULT 30,   -- Allowed to clock in 30 mins early
    late_tolerance_mins INT DEFAULT 10,    -- 10 mins grace period before marked LATE
    is_overtime_allowed BOOLEAN DEFAULT FALSE,
    color_code VARCHAR(20) DEFAULT '#10B981',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_shift_code UNIQUE (organization_id, code)
);

-- ============================================================================
-- 6. SCHEDULES (Monthly Roster / Shift Assignments)
-- ============================================================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL, -- NULL if status is OFF/LEAVE/etc.
    schedule_date DATE NOT NULL,
    schedule_type VARCHAR(20) DEFAULT 'SHIFT' NOT NULL CHECK (schedule_type IN ('SHIFT', 'OFF', 'LEAVE', 'SICK', 'HOLIDAY')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_member_schedule_date UNIQUE (organization_id, member_id, schedule_date)
);

-- ============================================================================
-- 7. ATTENDANCE (Daily Core Clock-in / Clock-out)
-- ============================================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    qr_token_id UUID REFERENCES qr_tokens(id) ON DELETE SET NULL,
    
    attendance_date DATE NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    
    check_in_source VARCHAR(20) DEFAULT 'KIOSK_QR' CHECK (check_in_source IN ('KIOSK_QR', 'ADMIN_MANUAL', 'MEMBER_PORTAL')),
    check_out_source VARCHAR(20) DEFAULT 'KIOSK_QR' CHECK (check_out_source IN ('KIOSK_QR', 'ADMIN_MANUAL', 'MEMBER_PORTAL')),
    
    status VARCHAR(30) DEFAULT 'PRESENT' NOT NULL CHECK (
        status IN ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'SICK', 'OFF', 'HOLIDAY', 'INCOMPLETE', 'REVIEW_REQUIRED', 'CORRECTED')
    ),
    
    late_minutes INT DEFAULT 0,
    early_arrival_minutes INT DEFAULT 0,
    work_duration_minutes INT DEFAULT 0,

    -- Anti-proxy review system
    review_status VARCHAR(20) DEFAULT 'NORMAL' NOT NULL CHECK (review_status IN ('NORMAL', 'PENDING_REVIEW', 'VERIFIED', 'FLAGGED_INVALID')),
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ,
    review_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- CRITICAL DATABASE-LEVEL DUPLICATE PROTECTION:
    -- A member can have only ONE attendance row per calendar date within an organization
    CONSTRAINT uq_org_member_date UNIQUE (organization_id, member_id, attendance_date)
);

-- ============================================================================
-- 8. ATTENDANCE CORRECTIONS (Audit Log for Timestamp Edits)
-- ============================================================================
CREATE TABLE attendance_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    corrected_by UUID NOT NULL REFERENCES app_users(id),
    
    previous_check_in TIMESTAMPTZ,
    new_check_in TIMESTAMPTZ,
    previous_check_out TIMESTAMPTZ,
    new_check_out TIMESTAMPTZ,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 9. AUDIT LOGS (Administrative Accountability)
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,         -- e.g. "MEMBER_CREATED", "QR_REVOKED", "SCHEDULE_UPDATED"
    target_type VARCHAR(50) NOT NULL,    -- e.g. "member", "shift", "attendance", "qr_token"
    target_id UUID,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 3. High-Performance Indexes

```sql
-- Fast QR token resolution in kiosk scan
CREATE INDEX idx_qr_tokens_value ON qr_tokens(token_value) WHERE status = 'ACTIVE';

-- Member schedule lookup by date
CREATE INDEX idx_schedules_member_date ON schedules(member_id, schedule_date);
CREATE INDEX idx_schedules_org_date ON schedules(organization_id, schedule_date);

-- Attendance queries for Today dashboard & Date range reports
CREATE INDEX idx_attendance_org_date ON attendance(organization_id, attendance_date);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, attendance_date);
CREATE INDEX idx_attendance_review ON attendance(organization_id, review_status) WHERE review_status != 'NORMAL';

-- Audit trail queries
CREATE INDEX idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
```

---

## 4. Atomic Attendance Stored Procedure (`record_attendance_scan`)

To prevent race conditions and guarantee absolute duplicate protection and server-side clock integrity, attendance scans execute through this atomic PostgreSQL procedure:

```sql
CREATE OR REPLACE FUNCTION record_attendance_scan(
    p_token_value TEXT,
    p_action_type TEXT -- 'MASUK' or 'PULANG'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_qr_record RECORD;
    v_member RECORD;
    v_schedule RECORD;
    v_shift RECORD;
    v_attendance RECORD;
    v_server_now TIMESTAMPTZ := NOW();
    v_current_date DATE;
    v_current_time TIME;
    v_late_minutes INT := 0;
    v_early_minutes INT := 0;
    v_status VARCHAR(30) := 'PRESENT';
    v_result JSONB;
BEGIN
    -- 1. Find and validate active QR token
    SELECT * INTO v_qr_record 
    FROM qr_tokens 
    WHERE token_value = p_token_value AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'code', 'INVALID_QR', 
            'message', 'Kartu QR tidak dikenali atau telah dinonaktifkan.'
        );
    END IF;

    -- 2. Find active member
    SELECT * INTO v_member 
    FROM members 
    WHERE id = v_qr_record.member_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'code', 'INACTIVE_MEMBER', 
            'message', 'Status karyawan tidak aktif. Hubungi administrator.'
        );
    END IF;

    -- Determine date and time in organization context
    v_current_date := CURRENT_DATE;
    v_current_time := CURRENT_TIME;

    -- 3. Check member's schedule for today
    SELECT * INTO v_schedule 
    FROM schedules 
    WHERE organization_id = v_member.organization_id 
      AND member_id = v_member.id 
      AND schedule_date = v_current_date;

    IF FOUND AND v_schedule.schedule_type IN ('OFF', 'LEAVE', 'SICK', 'HOLIDAY') THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'code', 'SCHEDULE_REST_DAY', 
            'message', 'Hari ini dijadwalkan: ' || v_schedule.schedule_type || '. Tidak perlu presensi.'
        );
    END IF;

    -- Load shift details if assigned
    IF FOUND AND v_schedule.shift_id IS NOT NULL THEN
        SELECT * INTO v_shift FROM shifts WHERE id = v_schedule.shift_id;
    END IF;

    -- 4. Process ACTION: MASUK (Check-In)
    IF UPPER(p_action_type) = 'MASUK' THEN
        -- Check if attendance row already exists today
        SELECT * INTO v_attendance 
        FROM attendance 
        WHERE organization_id = v_member.organization_id 
          AND member_id = v_member.id 
          AND attendance_date = v_current_date;

        IF FOUND AND v_attendance.check_in_at IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE, 
                'code', 'DUPLICATE_CHECK_IN', 
                'message', 'Anda sudah melakukan presensi masuk hari ini pada ' || TO_CHAR(v_attendance.check_in_at, 'HH24:MI:SS'),
                'member_name', v_member.full_name,
                'check_in_at', v_attendance.check_in_at
            );
        END IF;

        -- Shift timing calculation
        IF v_shift IS NOT NULL THEN
            -- Check late arrival
            IF v_current_time > (v_shift.start_time + (v_shift.late_tolerance_mins || ' minutes')::INTERVAL) THEN
                v_late_minutes := EXTRACT(EPOCH FROM (v_current_time - v_shift.start_time)) / 60;
                v_status := 'LATE';
            ELSIF v_current_time < v_shift.start_time THEN
                v_early_minutes := EXTRACT(EPOCH FROM (v_shift.start_time - v_current_time)) / 60;
                v_status := 'PRESENT';
            ELSE
                v_status := 'PRESENT';
            END IF;
        END IF;

        -- Insert fresh attendance row
        INSERT INTO attendance (
            organization_id, member_id, schedule_id, qr_token_id, 
            attendance_date, check_in_at, status, late_minutes, early_arrival_minutes
        ) VALUES (
            v_member.organization_id, v_member.id, v_schedule.id, v_qr_record.id,
            v_current_date, v_server_now, v_status, v_late_minutes, v_early_minutes
        )
        RETURNING * INTO v_attendance;

        RETURN jsonb_build_object(
            'success', TRUE,
            'code', 'CHECK_IN_SUCCESS',
            'message', 'Presensi masuk berhasil dicatat!',
            'member_name', v_member.full_name,
            'action', 'MASUK',
            'timestamp', v_server_now,
            'status', v_status,
            'late_minutes', v_late_minutes
        );

    -- 5. Process ACTION: PULANG (Check-Out)
    ELSIF UPPER(p_action_type) = 'PULANG' THEN
        SELECT * INTO v_attendance 
        FROM attendance 
        WHERE organization_id = v_member.organization_id 
          AND member_id = v_member.id 
          AND attendance_date = v_current_date;

        IF NOT FOUND OR v_attendance.check_in_at IS NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE, 
                'code', 'NO_CHECK_IN_FOUND', 
                'message', 'Belum bisa pulang. Belum ditemukan catatan presensi masuk hari ini.',
                'member_name', v_member.full_name
            );
        END IF;

        IF v_attendance.check_out_at IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', FALSE, 
                'code', 'DUPLICATE_CHECK_OUT', 
                'message', 'Anda sudah melakukan presensi pulang hari ini pada ' || TO_CHAR(v_attendance.check_out_at, 'HH24:MI:SS'),
                'member_name', v_member.full_name,
                'check_out_at', v_attendance.check_out_at
            );
        END IF;

        -- Calculate work duration
        UPDATE attendance 
        SET check_out_at = v_server_now,
            work_duration_minutes = EXTRACT(EPOCH FROM (v_server_now - v_attendance.check_in_at)) / 60,
            updated_at = NOW()
        WHERE id = v_attendance.id
        RETURNING * INTO v_attendance;

        RETURN jsonb_build_object(
            'success', TRUE,
            'code', 'CHECK_OUT_SUCCESS',
            'message', 'Presensi pulang berhasil dicatat. Sampai jumpa besok!',
            'member_name', v_member.full_name,
            'action', 'PULANG',
            'timestamp', v_server_now,
            'duration_minutes', v_attendance.work_duration_minutes
        );

    ELSE
        RETURN jsonb_build_object(
            'success', FALSE, 
            'code', 'INVALID_ACTION', 
            'message', 'Tindakan presensi tidak valid. Pilih MASUK atau PULANG.'
        );
    END IF;
END;
$$;
```

---

## 5. Row-Level Security (RLS) Policies

All tables have RLS enabled:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 5.1 Admin Role Policy (Tenant-Isolated Access)
Admins have full CRUD over rows matching their `organization_id`:

```sql
CREATE POLICY "Admin full access to own organization members"
ON members
FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM app_users WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

CREATE POLICY "Admin full access to own organization attendance"
ON attendance
FOR ALL
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM app_users WHERE id = auth.uid() AND role = 'ADMIN'
    )
);
```

### 5.2 Member Role Policy (Self-Access Only)
Members can strictly read only their own profile, schedule, and attendance:

```sql
CREATE POLICY "Member can view own profile"
ON members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

CREATE POLICY "Member can view own attendance"
ON attendance
FOR SELECT
TO authenticated
USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

CREATE POLICY "Member can view own schedule"
ON schedules
FOR SELECT
TO authenticated
USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);
```

### 5.3 Public Kiosk Scanner Execution
Kiosk devices invoke the `record_attendance_scan()` stored function via Supabase RPC. Direct `INSERT` or `UPDATE` on the `attendance` table is denied to anonymous users, ensuring all writes strictly go through the validation logic.
