-- ============================================================================
-- SEVN ABSENCE - POSTGRESQL SCHEMA MIGRATION
-- Project: Web-Based Employee Attendance System
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (Multi-Tenancy Root)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150),
    display_name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APP_USERS (Mapping to auth.users or standalone credentials)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMBERS (Staff & Employee Profiles)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    member_number VARCHAR(50),
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

-- 4. QR_TOKENS (Opaque Secure Identifiers for Kiosk Attendance)
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_value VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT
);

-- 5. SHIFTS (Configurable Work Schedules & Tolerances)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    early_tolerance_mins INT DEFAULT 30,
    late_tolerance_mins INT DEFAULT 10,
    is_overtime_allowed BOOLEAN DEFAULT FALSE,
    color_code VARCHAR(20) DEFAULT '#10B981',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_org_shift_code UNIQUE (organization_id, code)
);

-- 6. SCHEDULES (Monthly Roster / Shift Assignments)
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    schedule_date DATE NOT NULL,
    schedule_type VARCHAR(20) DEFAULT 'SHIFT' NOT NULL CHECK (schedule_type IN ('SHIFT', 'OFF', 'LEAVE', 'SICK', 'HOLIDAY')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_member_schedule_date UNIQUE (organization_id, member_id, schedule_date)
);

-- 7. ATTENDANCE (Core Daily Clock-in / Clock-out)
CREATE TABLE IF NOT EXISTS attendance (
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

    review_status VARCHAR(20) DEFAULT 'NORMAL' NOT NULL CHECK (review_status IN ('NORMAL', 'PENDING_REVIEW', 'VERIFIED', 'FLAGGED_INVALID')),
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ,
    review_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- DATABASE-LEVEL DUPLICATE PROTECTION: Exactly one record per member per date
    CONSTRAINT uq_org_member_date UNIQUE (organization_id, member_id, attendance_date)
);

-- 8. ATTENDANCE CORRECTIONS (Audit Log for Timestamp Edits)
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    corrected_by UUID REFERENCES app_users(id),
    
    previous_check_in TIMESTAMPTZ,
    new_check_in TIMESTAMPTZ,
    previous_check_out TIMESTAMPTZ,
    new_check_out TIMESTAMPTZ,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. AUDIT LOGS (Administrative Action Accountability)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES FOR FAST LOOKUP
CREATE INDEX IF NOT EXISTS idx_qr_tokens_value ON qr_tokens(token_value) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_schedules_member_date ON schedules(member_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_org_date ON schedules(organization_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance(organization_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, attendance_date);

-- ============================================================================
-- STORED FUNCTION: record_attendance_scan
-- Atomic evaluation with server-side NOW() and duplicate guard
-- ============================================================================
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

    v_current_date := CURRENT_DATE;
    v_current_time := CURRENT_TIME;

    -- 3. Check schedule for today
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

    IF FOUND AND v_schedule.shift_id IS NOT NULL THEN
        SELECT * INTO v_shift FROM shifts WHERE id = v_schedule.shift_id;
    END IF;

    -- 4. Process ACTION: MASUK
    IF UPPER(p_action_type) = 'MASUK' THEN
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

        IF v_shift IS NOT NULL THEN
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

    -- 5. Process ACTION: PULANG
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

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================
INSERT INTO organizations (id, company_name, branch_name, display_name, timezone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ABC Care',
    'Shimada Branch',
    'ABC Care - Shimada',
    'Asia/Jakarta'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO shifts (id, organization_id, name, code, start_time, end_time, early_tolerance_mins, late_tolerance_mins, color_code)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Shift Pagi (Shift A)', 'A', '08:00:00', '17:00:00', 30, 10, '#10B981'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Shift Siang (Shift B)', 'B', '13:00:00', '22:00:00', 30, 10, '#0284C7'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Shift Malam (Shift C)', 'C', '21:00:00', '06:00:00', 30, 10, '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

-- Initial Demo Members
INSERT INTO members (id, organization_id, member_number, full_name, email, department, position, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'EMP001', 'Musa Al-Fatih', 'musa@example.com', 'Operasional', 'Senior Staff', TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'EMP002', 'Ali bin Abi Thalib', 'ali@example.com', 'Pelayanan', 'Staff', TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'EMP003', 'Fatimah Az-Zahra', 'fatimah@example.com', 'Administrasi', 'Coordinator', TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'EMP004', 'Umar bin Khattab', 'umar@example.com', 'Keamanan & Logistik', 'Supervisor', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Active QR Tokens for Demo Members
INSERT INTO qr_tokens (id, organization_id, member_id, token_value, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'tok_musa_demo_98fbc12a', 'ACTIVE'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'tok_ali_demo_77ec94b0', 'ACTIVE'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'tok_fatimah_demo_11de82f5', 'ACTIVE'),
    ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'tok_umar_demo_44ab31cc', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
