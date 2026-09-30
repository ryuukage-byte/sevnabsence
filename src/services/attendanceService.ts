import { supabase } from './supabase';
import type {
  Member,
  Shift,
  Schedule,
  AttendanceRecord,
  ScanResult,
  AttendanceAction,
  AttendanceStatus,
  Organization,
  ReviewStatus,
  ScheduleType
} from '../types/attendance';

// Default Mock Data for local fallback or initial demo
const DEFAULT_ORG: Organization = {
  id: 'a0000000-0000-0000-0000-000000000001',
  company_name: 'ABC Care',
  branch_name: 'Shimada Branch',
  display_name: 'ABC Care - Shimada',
  timezone: 'Asia/Tokyo'
};

const DEFAULT_SHIFTS: Shift[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    organization_id: DEFAULT_ORG.id,
    name: 'Shift Pagi (Shift A)',
    code: 'A',
    start_time: '08:00',
    end_time: '17:00',
    early_tolerance_mins: 30,
    late_tolerance_mins: 10,
    is_overtime_allowed: false,
    color_code: '#3B7A57'
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    organization_id: DEFAULT_ORG.id,
    name: 'Shift Siang (Shift B)',
    code: 'B',
    start_time: '13:00',
    end_time: '22:00',
    early_tolerance_mins: 30,
    late_tolerance_mins: 10,
    is_overtime_allowed: false,
    color_code: '#C9944A'
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    organization_id: DEFAULT_ORG.id,
    name: 'Shift Malam (Shift C)',
    code: 'C',
    start_time: '21:00',
    end_time: '06:00',
    early_tolerance_mins: 30,
    late_tolerance_mins: 10,
    is_overtime_allowed: false,
    color_code: '#8D7B6D'
  }
];

const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    organization_id: DEFAULT_ORG.id,
    member_number: 'EMP001',
    full_name: 'Musa Al-Fatih',
    email: 'musa@example.com',
    phone: '081234567890',
    department: 'Operasional',
    position: 'Senior Staff',
    is_active: true,
    active_token: 'tok_musa_demo_98fbc12a'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    organization_id: DEFAULT_ORG.id,
    member_number: 'EMP002',
    full_name: 'Ali bin Abi Thalib',
    email: 'ali@example.com',
    phone: '081234567891',
    department: 'Pelayanan',
    position: 'Staff',
    is_active: true,
    active_token: 'tok_ali_demo_77ec94b0'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    organization_id: DEFAULT_ORG.id,
    member_number: 'EMP003',
    full_name: 'Fatimah Az-Zahra',
    email: 'fatimah@example.com',
    phone: '081234567892',
    department: 'Administrasi',
    position: 'Coordinator',
    is_active: true,
    active_token: 'tok_fatimah_demo_11de82f5'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    organization_id: DEFAULT_ORG.id,
    member_number: 'EMP004',
    full_name: 'Umar bin Khattab',
    email: 'umar@example.com',
    phone: '081234567893',
    department: 'Keamanan & Logistik',
    position: 'Supervisor',
    is_active: true,
    active_token: 'tok_umar_demo_44ab31cc'
  }
];

class AttendanceService {
  private org: Organization = DEFAULT_ORG;
  private shifts: Shift[] = DEFAULT_SHIFTS;
  private members: Member[] = DEFAULT_MEMBERS;
  private schedules: Schedule[] = [];
  private records: AttendanceRecord[] = [];
  private isLiveSupabase = false;

  constructor() {
    this.loadFromStorage();
    this.initSchedulesIfEmpty();
    this.initRecordsIfEmpty();
  }

  private initRecordsIfEmpty() {
    if (this.records.length === 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      this.records = [
        {
          id: 'rec_init_001',
          organization_id: this.org.id,
          member_id: this.members[0].id,
          member_name: this.members[0].full_name,
          department: this.members[0].department,
          shift_name: this.shifts[0].name,
          attendance_date: todayStr,
          check_in_at: `${todayStr}T08:02:15+09:00`,
          check_out_at: undefined,
          check_in_source: 'KIOSK_TABLET',
          check_out_source: '',
          status: 'PRESENT',
          late_minutes: 0,
          early_arrival_minutes: 0,
          work_duration_minutes: 0,
          review_status: 'NORMAL'
        },
        {
          id: 'rec_init_002',
          organization_id: this.org.id,
          member_id: this.members[1].id,
          member_name: this.members[1].full_name,
          department: this.members[1].department,
          shift_name: this.shifts[1].name,
          attendance_date: todayStr,
          check_in_at: `${todayStr}T13:25:40+09:00`,
          check_out_at: undefined,
          check_in_source: 'KIOSK_TABLET',
          check_out_source: '',
          status: 'LATE',
          late_minutes: 15,
          early_arrival_minutes: 0,
          work_duration_minutes: 0,
          review_status: 'NORMAL'
        },
        {
          id: 'rec_init_003',
          organization_id: this.org.id,
          member_id: this.members[2].id,
          member_name: this.members[2].full_name,
          department: this.members[2].department,
          shift_name: this.shifts[0].name,
          attendance_date: todayStr,
          check_in_at: `${todayStr}T07:55:00+09:00`,
          check_out_at: `${todayStr}T17:05:00+09:00`,
          check_in_source: 'KIOSK_TABLET',
          check_out_source: 'KIOSK_TABLET',
          status: 'PRESENT',
          late_minutes: 0,
          early_arrival_minutes: 5,
          work_duration_minutes: 550,
          review_status: 'NORMAL'
        }
      ];
      this.saveToStorage();
    }
  }

  private loadFromStorage() {
    try {
      const storedShifts = localStorage.getItem('sevn_shifts');
      if (storedShifts) this.shifts = JSON.parse(storedShifts);

      const storedMembers = localStorage.getItem('sevn_members');
      if (storedMembers) this.members = JSON.parse(storedMembers);

      const storedSchedules = localStorage.getItem('sevn_schedules');
      if (storedSchedules) this.schedules = JSON.parse(storedSchedules);

      const storedRecords = localStorage.getItem('sevn_records');
      if (storedRecords) this.records = JSON.parse(storedRecords);

      const storedOrg = localStorage.getItem('sevn_org');
      if (storedOrg) this.org = JSON.parse(storedOrg);
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('sevn_shifts', JSON.stringify(this.shifts));
      localStorage.setItem('sevn_members', JSON.stringify(this.members));
      localStorage.setItem('sevn_schedules', JSON.stringify(this.schedules));
      localStorage.setItem('sevn_records', JSON.stringify(this.records));
      localStorage.setItem('sevn_org', JSON.stringify(this.org));
    } catch {
      // ignore
    }
  }

  private initSchedulesIfEmpty() {
    if (this.schedules.length === 0) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const defaultSchedules: Schedule[] = [];
      this.members.forEach((m, mIdx) => {
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayOfWeek = new Date(year, month, d).getDay(); // 0 is Sunday
          
          let scheduleType: ScheduleType = 'SHIFT';
          let shiftId: string | undefined = this.shifts[mIdx % this.shifts.length].id;

          if (dayOfWeek === 0) {
            scheduleType = 'OFF';
            shiftId = undefined;
          }

          defaultSchedules.push({
            id: `sch_${m.id}_${dateStr}`,
            organization_id: this.org.id,
            member_id: m.id,
            shift_id: shiftId,
            schedule_date: dateStr,
            schedule_type: scheduleType
          });
        }
      });
      this.schedules = defaultSchedules;
      this.saveToStorage();
    }
  }

  // --- Scan Evaluation Engine ---
  async recordScan(tokenValue: string, actionType: AttendanceAction): Promise<ScanResult> {
    // 1. Try Supabase RPC first if available
    try {
      const { data, error } = await supabase.rpc('record_attendance_scan', {
        p_token_value: tokenValue,
        p_action_type: actionType
      });

      if (!error && data) {
        this.isLiveSupabase = true;
        return data as ScanResult;
      }
    } catch {
      // Fall through to strict local business rule engine
    }

    // 2. Strict local business logic (mirrors PostgreSQL procedure)
    const cleanToken = tokenValue.trim();
    const member = this.members.find((m) => m.active_token === cleanToken);

    if (!member) {
      return {
        success: false,
        code: 'INVALID_QR',
        message: 'Kartu QR tidak dikenali atau telah dinonaktifkan. Hubungi administrator.'
      };
    }

    if (!member.is_active) {
      return {
        success: false,
        code: 'INACTIVE_MEMBER',
        message: 'Status karyawan tidak aktif. Hubungi bagian personalia.'
      };
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find schedule for today
    const schedule = this.schedules.find(
      (s) => s.member_id === member.id && s.schedule_date === todayStr
    );

    if (schedule && ['OFF', 'LEAVE', 'SICK', 'HOLIDAY'].includes(schedule.schedule_type)) {
      return {
        success: false,
        code: 'SCHEDULE_REST_DAY',
        message: `Hari ini Anda dijadwalkan: ${schedule.schedule_type}. Presensi tidak diperlukan.`
      };
    }

    const assignedShift = this.shifts.find((s) => s.id === schedule?.shift_id) || this.shifts[0];

    // ACTION: MASUK
    if (actionType === 'MASUK') {
      const existing = this.records.find(
        (r) => r.member_id === member.id && r.attendance_date === todayStr
      );

      if (existing && existing.check_in_at) {
        const checkInTime = new Date(existing.check_in_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return {
          success: false,
          code: 'DUPLICATE_CHECK_IN',
          message: `Anda sudah melakukan presensi masuk hari ini pada pukul ${checkInTime}.`,
          member_name: member.full_name,
          check_in_at: existing.check_in_at
        };
      }

      // Compute late / early tolerances & sensible shift matching
      let status: AttendanceStatus = 'PRESENT';
      let reviewStatus: ReviewStatus = 'NORMAL';
      let reviewReason: string | undefined = undefined;
      let lateMinutes = 0;
      let earlyArrivalMins = 0;
      let feedbackMsg = 'Presensi masuk berhasil dicatat!';

      if (assignedShift) {
        const [shiftH, shiftM] = assignedShift.start_time.split(':').map(Number);
        const [endH, endM] = assignedShift.end_time.split(':').map(Number);
        const shiftStartMins = shiftH * 60 + shiftM;
        let shiftEndMins = endH * 60 + endM;
        if (shiftEndMins < shiftStartMins) {
          shiftEndMins += 24 * 60; // Cross-midnight shift (e.g. 21:00 - 06:00)
        }

        let currentMins = now.getHours() * 60 + now.getMinutes();
        if (assignedShift.start_time > assignedShift.end_time && currentMins < shiftStartMins && currentMins <= shiftEndMins - 24 * 60) {
          currentMins += 24 * 60;
        }

        const diffFromStart = currentMins - shiftStartMins;

        // If scan is > 4 hours after shift start -> flag as REVIEW_REQUIRED / PENDING_REVIEW
        if (diffFromStart > 240) {
          status = 'REVIEW_REQUIRED';
          reviewStatus = 'PENDING_REVIEW';
          lateMinutes = diffFromStart;
          reviewReason = `Presensi masuk selisih ${Math.floor(diffFromStart / 60)} jam dari jadwal ${assignedShift.name}. Perlu review supervisor.`;
          feedbackMsg = `Presensi tercatat di luar jam shift wajar (${assignedShift.name}). Ditandai untuk review.`;
        } else if (diffFromStart > assignedShift.late_tolerance_mins) {
          status = 'LATE';
          lateMinutes = diffFromStart;
        } else if (diffFromStart < 0) {
          earlyArrivalMins = Math.abs(diffFromStart);
        }
      }

      const newRecord: AttendanceRecord = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        organization_id: this.org.id,
        member_id: member.id,
        member_name: member.full_name,
        department: member.department,
        shift_name: assignedShift?.name || 'Shift A',
        schedule_id: schedule?.id,
        attendance_date: todayStr,
        check_in_at: now.toISOString(),
        check_in_source: 'KIOSK_QR',
        check_out_source: 'KIOSK_QR',
        status,
        late_minutes: lateMinutes,
        early_arrival_minutes: earlyArrivalMins,
        work_duration_minutes: 0,
        review_status: reviewStatus,
        review_reason: reviewReason
      };

      this.records.unshift(newRecord);
      this.saveToStorage();

      return {
        success: true,
        code: 'CHECK_IN_SUCCESS',
        message: feedbackMsg,
        member_name: member.full_name,
        action: 'MASUK',
        timestamp: now.toISOString(),
        status,
        late_minutes: lateMinutes
      };
    }

    // ACTION: PULANG
    if (actionType === 'PULANG') {
      const existing = this.records.find(
        (r) => r.member_id === member.id && r.attendance_date === todayStr
      );

      if (!existing || !existing.check_in_at) {
        return {
          success: false,
          code: 'NO_CHECK_IN_FOUND',
          message: 'Belum bisa pulang. Belum ditemukan catatan presensi masuk hari ini.',
          member_name: member.full_name
        };
      }

      if (existing.check_out_at) {
        const checkOutTime = new Date(existing.check_out_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return {
          success: false,
          code: 'DUPLICATE_CHECK_OUT',
          message: `Anda sudah melakukan presensi pulang hari ini pada pukul ${checkOutTime}.`,
          member_name: member.full_name,
          check_out_at: existing.check_out_at
        };
      }

      const checkInDate = new Date(existing.check_in_at);
      const durationMins = Math.round((now.getTime() - checkInDate.getTime()) / 60000);

      existing.check_out_at = now.toISOString();
      existing.work_duration_minutes = durationMins;
      this.saveToStorage();

      return {
        success: true,
        code: 'CHECK_OUT_SUCCESS',
        message: 'Presensi pulang berhasil dicatat. Sampai jumpa besok!',
        member_name: member.full_name,
        action: 'PULANG',
        timestamp: now.toISOString(),
        duration_minutes: durationMins
      };
    }

    return {
      success: false,
      code: 'INVALID_ACTION',
      message: 'Tindakan presensi tidak valid.'
    };
  }

  // --- Member Operations ---
  getMembers(): Member[] {
    return this.members;
  }

  addMember(memberData: Omit<Member, 'id' | 'organization_id' | 'active_token'>): Member {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const newMember: Member = {
      ...memberData,
      id: `c000_${Date.now()}`,
      organization_id: this.org.id,
      active_token: `tok_${memberData.full_name.toLowerCase().replace(/\s+/g, '_')}_${randomHex}`
    };
    this.members.push(newMember);
    this.saveToStorage();
    return newMember;
  }

  updateMember(id: string, updates: Partial<Member>): Member | null {
    const idx = this.members.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.members[idx] = { ...this.members[idx], ...updates };
    this.saveToStorage();
    return this.members[idx];
  }

  revokeAndIssueNewQR(memberId: string): string | null {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return null;
    const randomHex = Math.random().toString(36).substring(2, 12);
    member.active_token = `tok_${member.full_name.toLowerCase().replace(/\s+/g, '_')}_${randomHex}`;
    this.saveToStorage();
    return member.active_token;
  }

  // --- Shift Operations ---
  getShifts(): Shift[] {
    return this.shifts;
  }

  addShift(shiftData: Omit<Shift, 'id' | 'organization_id'>): Shift {
    const newShift: Shift = {
      ...shiftData,
      id: `b000_${Date.now()}`,
      organization_id: this.org.id
    };
    this.shifts.push(newShift);
    this.saveToStorage();
    return newShift;
  }

  updateShift(id: string, updates: Partial<Shift>): Shift | null {
    const idx = this.shifts.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.shifts[idx] = { ...this.shifts[idx], ...updates };
    this.saveToStorage();
    return this.shifts[idx];
  }

  // --- Schedule Operations ---
  getSchedules(year: number, month: number): Schedule[] {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.schedules.filter((s) => s.schedule_date.startsWith(monthPrefix));
  }

  updateCellSchedule(
    memberId: string,
    dateStr: string,
    scheduleType: ScheduleType,
    shiftId?: string
  ): void {
    const existingIdx = this.schedules.findIndex(
      (s) => s.member_id === memberId && s.schedule_date === dateStr
    );
    if (existingIdx !== -1) {
      this.schedules[existingIdx].schedule_type = scheduleType;
      this.schedules[existingIdx].shift_id = scheduleType === 'SHIFT' ? shiftId : undefined;
    } else {
      this.schedules.push({
        id: `sch_${memberId}_${dateStr}`,
        organization_id: this.org.id,
        member_id: memberId,
        shift_id: scheduleType === 'SHIFT' ? shiftId : undefined,
        schedule_date: dateStr,
        schedule_type: scheduleType
      });
    }
    this.saveToStorage();
  }

  // --- Attendance Records & Corrections ---
  getAttendanceRecords(): AttendanceRecord[] {
    return this.records;
  }

  getTodayRecords(): AttendanceRecord[] {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return this.records.filter((r) => r.attendance_date === todayStr);
  }

  correctAttendance(
    recordId: string,
    newCheckIn: string,
    newCheckOut: string,
    reason: string
  ): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.check_in_at = newCheckIn || undefined;
    rec.check_out_at = newCheckOut || undefined;
    rec.status = 'CORRECTED';
    rec.review_reason = reason;
    this.saveToStorage();
    return true;
  }

  reviewAttendance(recordId: string, status: ReviewStatus, reason?: string): boolean {
    const rec = this.records.find((r) => r.id === recordId);
    if (!rec) return false;

    rec.review_status = status;
    if (reason) rec.review_reason = reason;
    this.saveToStorage();
    return true;
  }

  // --- Organization & Settings ---
  getOrganization(): Organization {
    return this.org;
  }

  updateOrganization(updates: Partial<Organization>): Organization {
    this.org = { ...this.org, ...updates };
    this.saveToStorage();
    return this.org;
  }

  // --- CSV Export Helper ---
  exportToCSV(): string {
    const headers = [
      'Tanggal',
      'Nama Karyawan',
      'Departemen',
      'Shift',
      'Jam Masuk',
      'Jam Pulang',
      'Status',
      'Terlambat (Menit)',
      'Total Kerja (Menit)',
      'Status Review'
    ];

    const rows = this.records.map((r) => {
      const checkInFormatted = r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : '-';
      const checkOutFormatted = r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : '-';
      return [
        r.attendance_date,
        `"${r.member_name || ''}"`,
        `"${r.department || ''}"`,
        `"${r.shift_name || ''}"`,
        checkInFormatted,
        checkOutFormatted,
        r.status,
        r.late_minutes,
        r.work_duration_minutes,
        r.review_status
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

export const attendanceService = new AttendanceService();

/**
 * Format minutes into human-readable hours and minutes:
 * 8 -> "8 m"
 * 75 -> "1 j 15 m"
 * 953 -> "15 j 53 m"
 * 0 -> "–" (or empty fallback)
 */
export function formatDuration(minutes: number | undefined | null, emptyFallback = '–'): string {
  if (minutes === undefined || minutes === null || minutes <= 0) {
    return emptyFallback;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} m`;
  if (mins === 0) return `${hours} j`;
  return `${hours} j ${mins} m`;
}

/**
 * Format late minutes with "+" prefix:
 * 0 -> "Tepat Waktu"
 * 8 -> "+8 m"
 * 953 -> "+15 j 53 m"
 */
export function formatLateDuration(minutes: number | undefined | null): string {
  if (!minutes || minutes <= 0) return 'Tepat Waktu';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `+${mins} m`;
  if (mins === 0) return `+${hours} j`;
  return `+${hours} j ${mins} m`;
}

/**
 * Format timestamp strictly in the organization's branch timezone (default Asia/Tokyo)
 * Output format: HH:mm or HH:mm:ss with colon separator (24h)
 */
export function formatBranchTime(
  value: string | Date | undefined | null,
  timezone = 'Asia/Tokyo',
  includeSeconds = false
): string {
  if (!value) return '–';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '–';
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false
    });
    return formatter.format(d);
  } catch {
    return '–';
  }
}

/**
 * Format date in branch timezone: "1 Okt 2026" or "Sen, 1 Okt"
 */
export function formatBranchDate(
  value: string | Date | undefined | null,
  timezone = 'Asia/Tokyo',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '–';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '–';
    const defaultOpts: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return new Intl.DateTimeFormat('id-ID', options || defaultOpts).format(d);
  } catch {
    return '–';
  }
}
