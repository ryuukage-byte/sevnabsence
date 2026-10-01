export type AttendanceAction = 'MASUK' | 'PULANG';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'LEAVE'
  | 'SICK'
  | 'OFF'
  | 'HOLIDAY'
  | 'INCOMPLETE'
  | 'REVIEW_REQUIRED'
  | 'CORRECTED';

export type ReviewStatus = 'NORMAL' | 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED_INVALID';

export type ScheduleType = 'SHIFT' | 'OFF' | 'LEAVE' | 'SICK' | 'HOLIDAY';

export interface Organization {
  id: string;
  company_name: string;
  branch_name?: string;
  display_name: string;
  timezone: string;
}

export interface Shift {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  early_tolerance_mins: number;
  late_tolerance_mins: number;
  is_overtime_allowed: boolean;
  color_code: string;
}

export interface Member {
  id: string;
  organization_id: string;
  member_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  department: string;
  position: string;
  is_active: boolean;
  active_token?: string;
  avatar_url?: string;
  gender?: string;
  date_of_birth?: string;
}

export interface QRToken {
  id: string;
  organization_id: string;
  member_id: string;
  token_value: string;
  status: 'ACTIVE' | 'REVOKED';
  issued_at: string;
  revoked_at?: string;
}

export interface Schedule {
  id: string;
  organization_id: string;
  member_id: string;
  shift_id?: string;
  schedule_date: string; // YYYY-MM-DD
  schedule_type: ScheduleType;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  member_id: string;
  member_name?: string;
  department?: string;
  shift_name?: string;
  schedule_id?: string;
  qr_token_id?: string;
  attendance_date: string; // YYYY-MM-DD
  check_in_at?: string;    // ISO timestamp
  check_out_at?: string;   // ISO timestamp
  check_in_source: string;
  check_out_source: string;
  status: AttendanceStatus;
  late_minutes: number;
  early_arrival_minutes: number;
  work_duration_minutes: number;
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
}

export interface AttendanceCorrection {
  id: string;
  attendance_id: string;
  corrected_by: string;
  previous_check_in?: string;
  new_check_in?: string;
  previous_check_out?: string;
  new_check_out?: string;
  previous_status?: AttendanceStatus;
  new_status?: AttendanceStatus;
  reason: string;
  created_at: string;
}

export interface ScanResult {
  success: boolean;
  code: string;
  message: string;
  member_name?: string;
  action?: AttendanceAction;
  timestamp?: string;
  status?: AttendanceStatus;
  late_minutes?: number;
  duration_minutes?: number;
  check_in_at?: string;
  check_out_at?: string;
}
