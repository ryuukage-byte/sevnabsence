// Facility (shisetsu) domain model: floors, rooms, room tasks, skills, staff identity,
// member requests (kibou-kyuu / cuti) and the two-way message box.

export type FacilityType =
  | 'KAIGO_TOKUYOU'   // 特別養護老人ホーム
  | 'KAIGO_ROKEN'     // 介護老人保健施設
  | 'GROUP_HOME'      // グループホーム
  | 'DAY_SERVICE'     // デイサービス
  | 'OFFICE';         // Kantor umum

export interface FacilityTypeInfo {
  type: FacilityType;
  label: string;
  label_jp: string;
  description: string;
  available: boolean;
}

export interface FacilityProfile {
  facility_type: FacilityType;
  facility_name: string;
  resident_capacity: number;
  floors_count: number;
  configured: boolean;
}

export interface Floor {
  id: string;
  level: number;
  name: string;
  description?: string;
}

export type RoomCategory =
  | 'BATH'
  | 'DINING'
  | 'RESIDENT'
  | 'NURSE'
  | 'REHAB'
  | 'OFFICE'
  | 'LAUNDRY'
  | 'OTHER';

export interface Room {
  id: string;
  floor_id: string;
  name: string;
  name_jp?: string;
  category: RoomCategory;
  resident_count?: number;
  notes?: string;
}

export type SkillCategory = 'QUALIFICATION' | 'CARE' | 'OPERATION';

export interface Skill {
  id: string;
  code: string;
  name: string;
  name_jp?: string;
  category: SkillCategory;
}

export interface RoomTask {
  id: string;
  room_id: string;
  name: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  days_of_week: number[]; // 0 = Minggu ... 6 = Sabtu
  shift_ids: string[];    // shifts whose staff perform this task
  required_skill_ids: string[];
  min_staff: number;
  notes?: string;
}

export type QualificationLevel =
  | 'NONE'        // 無資格
  | 'SHONIN'      // 初任者研修
  | 'JITSUMU'     // 実務者研修
  | 'FUKUSHISHI'  // 介護福祉士
  | 'NURSE'       // 看護師
  | 'CAREMANAGER';// ケアマネジャー

export type EmploymentType = 'SEISHAIN' | 'KEIYAKU' | 'PART' | 'HAKEN' | 'TOKUTEI';

export interface StaffProfile {
  member_id: string;
  employment_type: EmploymentType;
  qualification: QualificationLevel;
  level: number; // 1 Trainee .. 5 Leader
  skill_ids: string[];
  allowed_shift_ids: string[];
  home_floor_id?: string;
  can_float: boolean; // may be placed on another floor when short-staffed
  max_night_per_month: number;
  monthly_off_target?: number; // overrides rule default when set
  paid_leave_balance: number;
  pin: string;
  notes?: string;
}

export interface CoverageRule {
  id: string;
  floor_id: string;
  shift_id: string;
  min_staff: number;
  weekend_min_staff?: number;
}

export interface SchedulingRules {
  monthly_off_days: number;
  max_consecutive_work_days: number;
  request_off_max_per_month: number;
  request_off_max_per_day: number;
  request_deadline_day: number; // requests for month M close on this day of month M-1
  night_shift_id?: string;
  off_after_ake: boolean;
  forbid_late_to_early: boolean;
  late_shift_id?: string;
  early_shift_id?: string;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface OffRequest {
  id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
  status: RequestStatus;
  created_at: string;
  decided_at?: string;
  admin_note?: string;
}

export type LeaveType = 'PAID' | 'SICK' | 'SPECIAL' | 'UNPAID';

export interface LeaveRequest {
  id: string;
  member_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: RequestStatus;
  created_at: string;
  decided_at?: string;
  admin_note?: string;
}

export type MessageCategory =
  | 'FEEDBACK'
  | 'WARNING'
  | 'NOTICE'
  | 'SYSTEM'
  | 'REPLY';

export const ADMIN_SENDER = 'ADMIN';
export const BROADCAST = 'ALL';

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;    // ADMIN or member id
  recipient_id: string; // ADMIN, member id or ALL
  category: MessageCategory;
  subject: string;
  body: string;
  created_at: string;
  read_by: string[];
}

export interface GeneratorWarning {
  date?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}
