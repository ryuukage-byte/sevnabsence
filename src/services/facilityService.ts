// Facility (shisetsu kaigo) service: master data, staff identity, member requests and messages.
// Persists to localStorage like attendanceService; other tabs are kept in sync via the
// `storage` event so the admin console and the member portal stay end-to-end consistent.
import { attendanceService, DEFAULT_SHIFTS } from './attendanceService';
import type { Member, ScheduleType } from '../types/attendance';
import {
  ADMIN_SENDER,
  BROADCAST,
  type CoverageRule,
  type FacilityProfile,
  type FacilityTypeInfo,
  type Floor,
  type LeaveRequest,
  type LeaveType,
  type Message,
  type MessageCategory,
  type OffRequest,
  type Room,
  type RoomTask,
  type SchedulingRules,
  type Skill,
  type StaffProfile
} from '../types/facility';

const KEY = 'sevn_kaigo_state';
const MEMBER_SESSION_KEY = 'sevn_member_session';

const [SH_HAYA, SH_NIKKIN, SH_OSO, SH_YAKIN] = DEFAULT_SHIFTS.map((s) => s.id);

export const FACILITY_TYPES: FacilityTypeInfo[] = [
  {
    type: 'KAIGO_TOKUYOU',
    label: 'Panti Lansia (Tokuyou)',
    label_jp: '特別養護老人ホーム',
    description: 'Fasilitas hunian 24 jam: shift 早・日・遅・夜, ofuro, unit hunian.',
    available: true
  },
  {
    type: 'KAIGO_ROKEN',
    label: 'Rehabilitasi Lansia (Rōken)',
    label_jp: '介護老人保健施設',
    description: 'Fokus rehabilitasi & perawat medis.',
    available: false
  },
  {
    type: 'GROUP_HOME',
    label: 'Group Home Demensia',
    label_jp: 'グループホーム',
    description: 'Unit kecil 9 penghuni per unit.',
    available: false
  },
  {
    type: 'DAY_SERVICE',
    label: 'Day Service',
    label_jp: 'デイサービス',
    description: 'Layanan siang hari dengan antar-jemput.',
    available: false
  },
  {
    type: 'OFFICE',
    label: 'Kantor Umum',
    label_jp: 'オフィス',
    description: 'Jam kerja kantor biasa tanpa ruangan perawatan.',
    available: false
  }
];

export const QUALIFICATION_LABELS: Record<StaffProfile['qualification'], string> = {
  NONE: 'Tanpa sertifikat (無資格)',
  SHONIN: 'Shoninsha Kenshū (初任者研修)',
  JITSUMU: 'Jitsumusha Kenshū (実務者研修)',
  FUKUSHISHI: 'Kaigo Fukushishi (介護福祉士)',
  NURSE: 'Perawat (看護師)',
  CAREMANAGER: 'Care Manager (ケアマネ)'
};

export const EMPLOYMENT_LABELS: Record<StaffProfile['employment_type'], string> = {
  SEISHAIN: 'Karyawan tetap (正社員)',
  KEIYAKU: 'Kontrak (契約社員)',
  PART: 'Paruh waktu (パート)',
  HAKEN: 'Outsourcing (派遣)',
  TOKUTEI: 'Tokutei Ginō (特定技能)'
};

export const LEVEL_LABELS: Record<number, string> = {
  1: 'Lv1 · Trainee',
  2: 'Lv2 · Junior',
  3: 'Lv3 · Mandiri',
  4: 'Lv4 · Senior',
  5: 'Lv5 · Leader'
};

export const LEAVE_LABELS: Record<LeaveType, string> = {
  PAID: 'Cuti berbayar (有給)',
  SICK: 'Izin sakit (病欠)',
  SPECIAL: 'Cuti khusus (特別休暇)',
  UNPAID: 'Cuti tidak dibayar (欠勤)'
};

export const ROOM_CATEGORY_LABELS: Record<Room['category'], string> = {
  BATH: 'Kamar mandi / Ofuro',
  DINING: 'Ruang makan',
  RESIDENT: 'Kamar penghuni',
  NURSE: 'Ruang perawat',
  REHAB: 'Rehabilitasi / rekreasi',
  OFFICE: 'Kantor / staff station',
  LAUNDRY: 'Laundry',
  OTHER: 'Lainnya'
};

export const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// ---------------------------------------------------------------------------
// Template: 2-floor tokuyou
// ---------------------------------------------------------------------------
const TEMPLATE_SKILLS: Skill[] = [
  { id: 'sk_fukushi', code: 'KF', name: 'Kaigo Fukushishi', name_jp: '介護福祉士', category: 'QUALIFICATION' },
  { id: 'sk_jitsumu', code: 'JK', name: 'Jitsumusha Kenshū', name_jp: '実務者研修', category: 'QUALIFICATION' },
  { id: 'sk_nurse', code: 'NS', name: 'Perawat berlisensi', name_jp: '看護師', category: 'QUALIFICATION' },
  { id: 'sk_bath', code: 'BATH', name: 'Bantuan mandi', name_jp: '入浴介助', category: 'CARE' },
  { id: 'sk_meal', code: 'MEAL', name: 'Bantuan makan', name_jp: '食事介助', category: 'CARE' },
  { id: 'sk_toilet', code: 'WC', name: 'Bantuan toilet / popok', name_jp: '排泄介助', category: 'CARE' },
  { id: 'sk_transfer', code: 'TRF', name: 'Transfer kursi roda', name_jp: '移乗介助', category: 'CARE' },
  { id: 'sk_suction', code: 'SUC', name: 'Suction dahak', name_jp: '喀痰吸引', category: 'CARE' },
  { id: 'sk_med', code: 'MED', name: 'Pembagian obat', name_jp: '服薬介助', category: 'CARE' },
  { id: 'sk_night', code: 'NGT', name: 'Siap shift malam', name_jp: '夜勤対応', category: 'OPERATION' },
  { id: 'sk_leader', code: 'LDR', name: 'Leader shift', name_jp: 'リーダー業務', category: 'OPERATION' },
  { id: 'sk_record', code: 'REC', name: 'Pencatatan & handover', name_jp: '記録・申し送り', category: 'OPERATION' },
  { id: 'sk_driver', code: 'DRV', name: 'Supir antar-jemput', name_jp: '送迎運転', category: 'OPERATION' }
];

const TEMPLATE_FLOORS: Floor[] = [
  { id: 'fl_1', level: 1, name: 'Lantai 1', description: 'Area umum, ofuro besar, ruang perawat & Unit A (20 penghuni)' },
  { id: 'fl_2', level: 2, name: 'Lantai 2', description: 'Unit B hunian (20 penghuni), kobuyoku & ruang makan lantai 2' }
];

const TEMPLATE_ROOMS: Room[] = [
  { id: 'rm_1_bath', floor_id: 'fl_1', name: 'Ofuro Besar', name_jp: '大浴場・機械浴', category: 'BATH', notes: 'Ada mesin mandi (特浴) untuk penghuni berbaring' },
  { id: 'rm_1_dining', floor_id: 'fl_1', name: 'Ruang Makan & Fungsi', name_jp: '食堂・機能訓練室', category: 'DINING' },
  { id: 'rm_1_unit', floor_id: 'fl_1', name: 'Kamar Unit A', name_jp: '居室 A ユニット', category: 'RESIDENT', resident_count: 20 },
  { id: 'rm_1_nurse', floor_id: 'fl_1', name: 'Ruang Perawat', name_jp: '医務室', category: 'NURSE' },
  { id: 'rm_1_office', floor_id: 'fl_1', name: 'Kantor & Staff Station', name_jp: '事務所', category: 'OFFICE' },
  { id: 'rm_1_laundry', floor_id: 'fl_1', name: 'Laundry', name_jp: '洗濯室', category: 'LAUNDRY' },
  { id: 'rm_2_unit', floor_id: 'fl_2', name: 'Kamar Unit B', name_jp: '居室 B ユニット', category: 'RESIDENT', resident_count: 20 },
  { id: 'rm_2_dining', floor_id: 'fl_2', name: 'Ruang Makan Lt.2', name_jp: '2階食堂', category: 'DINING' },
  { id: 'rm_2_bath', floor_id: 'fl_2', name: 'Kobuyoku (mandi individu)', name_jp: '個浴室', category: 'BATH' },
  { id: 'rm_2_station', floor_id: 'fl_2', name: 'Staff Station Lt.2', name_jp: '2階ステーション', category: 'OFFICE' }
];

const TEMPLATE_TASKS: RoomTask[] = [
  // Lantai 1
  { id: 'tk_1', room_id: 'rm_1_bath', name: 'Persiapan & cek suhu ofuro', start_time: '09:00', end_time: '09:30', days_of_week: [1, 3, 5], shift_ids: [SH_NIKKIN], required_skill_ids: [], min_staff: 1 },
  { id: 'tk_2', room_id: 'rm_1_bath', name: 'Bantuan mandi pagi (入浴 午前)', start_time: '09:30', end_time: '12:00', days_of_week: [1, 3, 5], shift_ids: [SH_NIKKIN, SH_HAYA], required_skill_ids: ['sk_bath'], min_staff: 2, notes: 'Min. 1 orang lantai, 1 orang di dalam ruang mandi' },
  { id: 'tk_3', room_id: 'rm_1_bath', name: 'Bantuan mandi siang (入浴 午後)', start_time: '13:30', end_time: '16:00', days_of_week: [1, 3, 5], shift_ids: [SH_NIKKIN, SH_OSO], required_skill_ids: ['sk_bath', 'sk_transfer'], min_staff: 2 },
  { id: 'tk_4', room_id: 'rm_1_dining', name: 'Bantuan sarapan (朝食介助)', start_time: '07:30', end_time: '08:30', days_of_week: ALL_DAYS, shift_ids: [SH_HAYA, SH_YAKIN], required_skill_ids: ['sk_meal'], min_staff: 2 },
  { id: 'tk_5', room_id: 'rm_1_dining', name: 'Bantuan makan siang (昼食介助)', start_time: '12:00', end_time: '13:00', days_of_week: ALL_DAYS, shift_ids: [SH_HAYA, SH_NIKKIN, SH_OSO], required_skill_ids: ['sk_meal'], min_staff: 2 },
  { id: 'tk_6', room_id: 'rm_1_dining', name: 'Bantuan makan malam (夕食介助)', start_time: '18:00', end_time: '19:00', days_of_week: ALL_DAYS, shift_ids: [SH_OSO, SH_YAKIN], required_skill_ids: ['sk_meal'], min_staff: 2 },
  { id: 'tk_7', room_id: 'rm_1_dining', name: 'Senam & rekreasi (機能訓練・レク)', start_time: '14:00', end_time: '15:00', days_of_week: [2, 4], shift_ids: [SH_NIKKIN], required_skill_ids: [], min_staff: 1 },
  { id: 'tk_8', room_id: 'rm_1_unit', name: 'Bangun pagi & ganti baju (起床介助)', start_time: '06:00', end_time: '07:30', days_of_week: ALL_DAYS, shift_ids: [SH_YAKIN, SH_HAYA], required_skill_ids: ['sk_transfer'], min_staff: 1 },
  { id: 'tk_9', room_id: 'rm_1_unit', name: 'Ronde malam & ganti popok (巡視・排泄)', start_time: '22:00', end_time: '05:00', days_of_week: ALL_DAYS, shift_ids: [SH_YAKIN], required_skill_ids: ['sk_night', 'sk_toilet'], min_staff: 1, notes: 'Ronde tiap 2 jam, catat di sistem' },
  { id: 'tk_10', room_id: 'rm_1_nurse', name: 'Pembagian obat pagi (服薬)', start_time: '07:45', end_time: '08:15', days_of_week: ALL_DAYS, shift_ids: [SH_HAYA, SH_NIKKIN], required_skill_ids: ['sk_med'], min_staff: 1 },
  { id: 'tk_11', room_id: 'rm_1_nurse', name: 'Suction dahak (喀痰吸引)', start_time: '10:00', end_time: '10:30', days_of_week: ALL_DAYS, shift_ids: [SH_NIKKIN], required_skill_ids: ['sk_suction'], min_staff: 1 },
  { id: 'tk_12', room_id: 'rm_1_office', name: 'Handover pagi (申し送り)', start_time: '09:00', end_time: '09:15', days_of_week: ALL_DAYS, shift_ids: [SH_YAKIN, SH_HAYA, SH_NIKKIN], required_skill_ids: ['sk_record'], min_staff: 1 },
  { id: 'tk_13', room_id: 'rm_1_laundry', name: 'Cuci & lipat linen', start_time: '13:00', end_time: '14:00', days_of_week: ALL_DAYS, shift_ids: [SH_OSO, SH_NIKKIN], required_skill_ids: [], min_staff: 1 },
  // Lantai 2
  { id: 'tk_14', room_id: 'rm_2_bath', name: 'Mandi individu (個浴)', start_time: '10:00', end_time: '12:00', days_of_week: [2, 4, 6], shift_ids: [SH_NIKKIN], required_skill_ids: ['sk_bath'], min_staff: 1 },
  { id: 'tk_15', room_id: 'rm_2_dining', name: 'Bantuan sarapan Lt.2', start_time: '07:30', end_time: '08:30', days_of_week: ALL_DAYS, shift_ids: [SH_HAYA, SH_YAKIN], required_skill_ids: ['sk_meal'], min_staff: 1 },
  { id: 'tk_16', room_id: 'rm_2_dining', name: 'Bantuan makan siang Lt.2', start_time: '12:00', end_time: '13:00', days_of_week: ALL_DAYS, shift_ids: [SH_HAYA, SH_NIKKIN, SH_OSO], required_skill_ids: ['sk_meal'], min_staff: 2 },
  { id: 'tk_17', room_id: 'rm_2_dining', name: 'Bantuan makan malam Lt.2', start_time: '18:00', end_time: '19:00', days_of_week: ALL_DAYS, shift_ids: [SH_OSO, SH_YAKIN], required_skill_ids: ['sk_meal'], min_staff: 1 },
  { id: 'tk_18', room_id: 'rm_2_unit', name: 'Ronde malam Lt.2 (巡視)', start_time: '22:00', end_time: '05:00', days_of_week: ALL_DAYS, shift_ids: [SH_YAKIN], required_skill_ids: ['sk_night', 'sk_toilet'], min_staff: 1 },
  { id: 'tk_19', room_id: 'rm_2_station', name: 'Leader & koordinasi unit', start_time: '08:30', end_time: '17:30', days_of_week: [1, 2, 3, 4, 5], shift_ids: [SH_NIKKIN], required_skill_ids: ['sk_leader'], min_staff: 1 }
];

const TEMPLATE_COVERAGE: CoverageRule[] = [
  { id: 'cv_1', floor_id: 'fl_1', shift_id: SH_HAYA, min_staff: 1 },
  { id: 'cv_2', floor_id: 'fl_1', shift_id: SH_NIKKIN, min_staff: 2, weekend_min_staff: 1 },
  { id: 'cv_3', floor_id: 'fl_1', shift_id: SH_OSO, min_staff: 1 },
  { id: 'cv_4', floor_id: 'fl_1', shift_id: SH_YAKIN, min_staff: 1 },
  { id: 'cv_5', floor_id: 'fl_2', shift_id: SH_HAYA, min_staff: 1 },
  { id: 'cv_6', floor_id: 'fl_2', shift_id: SH_NIKKIN, min_staff: 1 },
  { id: 'cv_7', floor_id: 'fl_2', shift_id: SH_OSO, min_staff: 1 },
  { id: 'cv_8', floor_id: 'fl_2', shift_id: SH_YAKIN, min_staff: 1 }
];

const DEFAULT_RULES: SchedulingRules = {
  monthly_off_days: 9,
  max_consecutive_work_days: 5,
  request_off_max_per_month: 3,
  request_off_max_per_day: 2,
  request_deadline_day: 20,
  night_shift_id: SH_YAKIN,
  off_after_ake: true,
  forbid_late_to_early: true,
  late_shift_id: SH_OSO,
  early_shift_id: SH_HAYA
};

interface FacilityState {
  profile: FacilityProfile;
  floors: Floor[];
  rooms: Room[];
  tasks: RoomTask[];
  skills: Skill[];
  coverage: CoverageRule[];
  rules: SchedulingRules;
  staff: StaffProfile[];
  offRequests: OffRequest[];
  leaveRequests: LeaveRequest[];
  messages: Message[];
  publishedMonths: string[]; // YYYY-MM
}

function templateState(): FacilityState {
  return {
    profile: {
      facility_type: 'KAIGO_TOKUYOU',
      facility_name: 'Tokuyou Sakura no Sato',
      resident_capacity: 40,
      floors_count: 2,
      configured: true
    },
    floors: structuredClone(TEMPLATE_FLOORS),
    rooms: structuredClone(TEMPLATE_ROOMS),
    tasks: structuredClone(TEMPLATE_TASKS),
    skills: structuredClone(TEMPLATE_SKILLS),
    coverage: structuredClone(TEMPLATE_COVERAGE),
    rules: { ...DEFAULT_RULES },
    staff: [],
    offRequests: [],
    leaveRequests: [],
    messages: [],
    publishedMonths: []
  };
}

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

function daysBetweenInclusive(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  while (d <= e) {
    out.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

class FacilityService {
  private state: FacilityState = templateState();
  private listeners = new Set<() => void>();
  private version = 0;

  constructor() {
    this.load();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (!e.key || e.key === KEY || e.key.startsWith('sevn_')) {
          this.load();
          attendanceService.reload();
          this.emit();
        }
      });
    }
  }

  // ----- persistence & subscription -----
  private load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.state = { ...templateState(), ...JSON.parse(raw) };
    } catch {
      // keep template
    }
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // ignore quota errors
    }
    this.emit();
  }

  private emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getVersion = () => this.version;

  /** Let other services (attendance schedule edits) refresh subscribed views. */
  touch() {
    this.emit();
  }

  // ----- facility profile -----
  getProfile() {
    return this.state.profile;
  }

  updateProfile(updates: Partial<FacilityProfile>) {
    this.state.profile = { ...this.state.profile, ...updates };
    this.save();
  }

  /** Reset floors/rooms/tasks/skills/coverage/rules + kaigo shifts to the 2-floor tokuyou template. */
  applyKaigoTemplate() {
    const t = templateState();
    this.state = {
      ...this.state,
      profile: t.profile,
      floors: t.floors,
      rooms: t.rooms,
      tasks: t.tasks,
      skills: t.skills,
      coverage: t.coverage,
      rules: t.rules
    };
    attendanceService.replaceShifts(DEFAULT_SHIFTS);
    this.save();
  }

  // ----- floors / rooms / tasks -----
  getFloors() {
    return [...this.state.floors].sort((a, b) => a.level - b.level);
  }

  saveFloor(floor: Floor) {
    const idx = this.state.floors.findIndex((f) => f.id === floor.id);
    if (idx >= 0) this.state.floors[idx] = floor;
    else this.state.floors.push(floor);
    this.state.profile.floors_count = this.state.floors.length;
    this.save();
  }

  deleteFloor(id: string) {
    const roomIds = this.state.rooms.filter((r) => r.floor_id === id).map((r) => r.id);
    this.state.floors = this.state.floors.filter((f) => f.id !== id);
    this.state.rooms = this.state.rooms.filter((r) => r.floor_id !== id);
    this.state.tasks = this.state.tasks.filter((t) => !roomIds.includes(t.room_id));
    this.state.coverage = this.state.coverage.filter((c) => c.floor_id !== id);
    this.state.profile.floors_count = this.state.floors.length;
    this.save();
  }

  getRooms(floorId?: string) {
    return this.state.rooms.filter((r) => !floorId || r.floor_id === floorId);
  }

  saveRoom(room: Room) {
    const idx = this.state.rooms.findIndex((r) => r.id === room.id);
    if (idx >= 0) this.state.rooms[idx] = room;
    else this.state.rooms.push(room);
    this.save();
  }

  deleteRoom(id: string) {
    this.state.rooms = this.state.rooms.filter((r) => r.id !== id);
    this.state.tasks = this.state.tasks.filter((t) => t.room_id !== id);
    this.save();
  }

  getTasks(roomId?: string) {
    return this.state.tasks
      .filter((t) => !roomId || t.room_id === roomId)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  saveTask(task: RoomTask) {
    const idx = this.state.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) this.state.tasks[idx] = task;
    else this.state.tasks.push(task);
    this.save();
  }

  deleteTask(id: string) {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== id);
    this.save();
  }

  getFloorOfRoom(roomId: string) {
    const room = this.state.rooms.find((r) => r.id === roomId);
    return room ? this.state.floors.find((f) => f.id === room.floor_id) : undefined;
  }

  // ----- skills -----
  getSkills() {
    return this.state.skills;
  }

  saveSkill(skill: Skill) {
    const idx = this.state.skills.findIndex((s) => s.id === skill.id);
    if (idx >= 0) this.state.skills[idx] = skill;
    else this.state.skills.push(skill);
    this.save();
  }

  deleteSkill(id: string) {
    this.state.skills = this.state.skills.filter((s) => s.id !== id);
    this.state.staff.forEach((p) => (p.skill_ids = p.skill_ids.filter((x) => x !== id)));
    this.state.tasks.forEach((t) => (t.required_skill_ids = t.required_skill_ids.filter((x) => x !== id)));
    this.save();
  }

  // ----- coverage & rules -----
  getCoverage() {
    return this.state.coverage;
  }

  setCoverage(floorId: string, shiftId: string, minStaff: number, weekendMin?: number) {
    const existing = this.state.coverage.find((c) => c.floor_id === floorId && c.shift_id === shiftId);
    if (existing) {
      existing.min_staff = minStaff;
      existing.weekend_min_staff = weekendMin;
    } else {
      this.state.coverage.push({ id: uid('cv'), floor_id: floorId, shift_id: shiftId, min_staff: minStaff, weekend_min_staff: weekendMin });
    }
    this.save();
  }

  getRules() {
    return this.state.rules;
  }

  updateRules(updates: Partial<SchedulingRules>) {
    this.state.rules = { ...this.state.rules, ...updates };
    this.save();
  }

  // ----- staff identity -----
  defaultProfile(member: Member): StaffProfile {
    const shifts = attendanceService.getShifts();
    return {
      member_id: member.id,
      employment_type: 'SEISHAIN',
      qualification: 'NONE',
      level: 1,
      skill_ids: [],
      allowed_shift_ids: shifts.filter((s) => s.id !== this.state.rules.night_shift_id).map((s) => s.id),
      home_floor_id: this.state.floors[0]?.id,
      can_float: true,
      max_night_per_month: 0,
      paid_leave_balance: 10,
      pin: (member.member_number || '0000').slice(-4)
    };
  }

  getStaffProfile(memberId: string): StaffProfile {
    const found = this.state.staff.find((p) => p.member_id === memberId);
    if (found) return found;
    const member = attendanceService.getMembers().find((m) => m.id === memberId);
    return member ? this.defaultProfile(member) : ({ member_id: memberId } as StaffProfile);
  }

  hasStaffProfile(memberId: string) {
    return this.state.staff.some((p) => p.member_id === memberId);
  }

  saveStaffProfile(profile: StaffProfile) {
    const idx = this.state.staff.findIndex((p) => p.member_id === profile.member_id);
    if (idx >= 0) this.state.staff[idx] = profile;
    else this.state.staff.push(profile);
    this.save();
  }

  // ----- publication -----
  isPublished(year: number, month: number) {
    return this.state.publishedMonths.includes(monthKey(year, month));
  }

  publishMonth(year: number, month: number) {
    const key = monthKey(year, month);
    if (!this.state.publishedMonths.includes(key)) this.state.publishedMonths.push(key);
    const label = new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    this.pushMessage({
      sender_id: ADMIN_SENDER,
      recipient_id: BROADCAST,
      category: 'SYSTEM',
      subject: `Jadwal shift ${label} sudah terbit`,
      body: `Jadwal shift bulan ${label} sudah dipublikasikan. Silakan cek di menu Kalender Shift. Jika ada kendala, balas pesan ini.`
    });
    this.save();
  }

  unpublishMonth(year: number, month: number) {
    const key = monthKey(year, month);
    this.state.publishedMonths = this.state.publishedMonths.filter((m) => m !== key);
    this.save();
  }

  // ----- off requests (希望休) -----
  getOffRequests(filter?: { memberId?: string; month?: string; status?: OffRequest['status'] }) {
    return this.state.offRequests
      .filter((r) => !filter?.memberId || r.member_id === filter.memberId)
      .filter((r) => !filter?.month || r.date.startsWith(filter.month))
      .filter((r) => !filter?.status || r.status === filter.status)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /** Rules a member can see before submitting: quota, per-day cap and deadline. */
  getOffRequestQuota(memberId: string, year: number, month: number) {
    const mk = monthKey(year, month);
    const used = this.state.offRequests.filter(
      (r) => r.member_id === memberId && r.date.startsWith(mk) && (r.status === 'PENDING' || r.status === 'APPROVED')
    ).length;
    const deadline = new Date(year, month - 2, this.state.rules.request_deadline_day, 23, 59, 59);
    return {
      used,
      max: this.state.rules.request_off_max_per_month,
      remaining: Math.max(0, this.state.rules.request_off_max_per_month - used),
      deadline,
      isClosed: new Date() > deadline || this.isPublished(year, month)
    };
  }

  countOffRequestsOnDate(date: string) {
    return this.state.offRequests.filter((r) => r.date === date && (r.status === 'PENDING' || r.status === 'APPROVED')).length;
  }

  submitOffRequest(memberId: string, date: string, reason: string): ActionResult {
    const [y, m] = date.split('-').map(Number);
    const quota = this.getOffRequestQuota(memberId, y, m);
    const rules = this.state.rules;
    if (date <= toDateStr(new Date())) return { ok: false, message: 'Tanggal yang sudah lewat / hari ini tidak bisa diajukan.' };
    if (this.isPublished(y, m)) return { ok: false, message: 'Jadwal bulan ini sudah dipublikasikan. Hubungi admin lewat Kotak Pesan.' };
    if (new Date() > quota.deadline) {
      return {
        ok: false,
        message: `Batas pengajuan bulan ini sudah lewat (tgl ${rules.request_deadline_day} bulan sebelumnya).`
      };
    }
    if (this.state.offRequests.some((r) => r.member_id === memberId && r.date === date && (r.status === 'PENDING' || r.status === 'APPROVED'))) {
      return { ok: false, message: 'Tanggal ini sudah Anda ajukan.' };
    }
    if (quota.remaining <= 0) return { ok: false, message: `Kuota libur yang diinginkan habis (maks ${quota.max}x per bulan).` };
    if (this.countOffRequestsOnDate(date) >= rules.request_off_max_per_day) {
      return { ok: false, message: `Tanggal ini sudah penuh (maks ${rules.request_off_max_per_day} staf mengajukan libur di hari yang sama).` };
    }
    this.state.offRequests.push({
      id: uid('off'),
      member_id: memberId,
      date,
      reason: reason.trim() || undefined,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });
    this.save();
    return { ok: true, message: 'Pengajuan libur terkirim. Menunggu persetujuan admin.' };
  }

  cancelOffRequest(id: string, memberId: string) {
    const r = this.state.offRequests.find((x) => x.id === id && x.member_id === memberId);
    if (r && r.status === 'PENDING') {
      r.status = 'CANCELLED';
      this.save();
    }
  }

  decideOffRequest(id: string, approve: boolean, note?: string) {
    const r = this.state.offRequests.find((x) => x.id === id);
    if (!r) return;
    r.status = approve ? 'APPROVED' : 'REJECTED';
    r.decided_at = new Date().toISOString();
    r.admin_note = note?.trim() || undefined;
    if (approve) {
      attendanceService.updateCellSchedule(r.member_id, r.date, 'REQ_OFF');
    }
    const dateLabel = new Date(`${r.date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    this.pushMessage({
      sender_id: ADMIN_SENDER,
      recipient_id: r.member_id,
      category: 'SYSTEM',
      subject: `Libur yang diinginkan ${approve ? 'disetujui' : 'ditolak'}: ${dateLabel}`,
      body: approve
        ? `Pengajuan libur (希望休) untuk ${dateLabel} disetujui.${r.admin_note ? `\nCatatan admin: ${r.admin_note}` : ''}`
        : `Maaf, pengajuan libur untuk ${dateLabel} belum bisa disetujui.${r.admin_note ? `\nAlasan: ${r.admin_note}` : ''}`
    });
    this.save();
  }

  // ----- leave requests (cuti) -----
  getLeaveRequests(filter?: { memberId?: string; status?: LeaveRequest['status'] }) {
    return this.state.leaveRequests
      .filter((r) => !filter?.memberId || r.member_id === filter.memberId)
      .filter((r) => !filter?.status || r.status === filter.status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  pendingPaidLeaveDays(memberId: string) {
    return this.state.leaveRequests
      .filter((r) => r.member_id === memberId && r.status === 'PENDING' && r.leave_type === 'PAID')
      .reduce((sum, r) => sum + r.days, 0);
  }

  submitLeaveRequest(memberId: string, leaveType: LeaveType, start: string, end: string, reason: string): ActionResult {
    if (!start || !end) return { ok: false, message: 'Tanggal mulai dan selesai wajib diisi.' };
    if (end < start) return { ok: false, message: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' };
    if (leaveType !== 'SICK' && start < toDateStr(new Date())) {
      return { ok: false, message: 'Cuti harus diajukan untuk tanggal mendatang.' };
    }
    if (!reason.trim()) return { ok: false, message: 'Alasan cuti wajib diisi.' };
    const days = daysBetweenInclusive(start, end).length;
    if (days > 30) return { ok: false, message: 'Maksimal 30 hari per pengajuan.' };
    const overlap = this.state.leaveRequests.some(
      (r) => r.member_id === memberId && (r.status === 'PENDING' || r.status === 'APPROVED') && r.start_date <= end && r.end_date >= start
    );
    if (overlap) return { ok: false, message: 'Periode ini bertabrakan dengan pengajuan cuti lain.' };
    if (leaveType === 'PAID') {
      const profile = this.getStaffProfile(memberId);
      const available = (profile.paid_leave_balance ?? 0) - this.pendingPaidLeaveDays(memberId);
      if (days > available) return { ok: false, message: `Sisa cuti berbayar tidak cukup (tersedia ${available} hari).` };
    }
    this.state.leaveRequests.push({
      id: uid('lv'),
      member_id: memberId,
      leave_type: leaveType,
      start_date: start,
      end_date: end,
      days,
      reason: reason.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    });
    this.save();
    return { ok: true, message: `Pengajuan cuti ${days} hari terkirim ke admin.` };
  }

  cancelLeaveRequest(id: string, memberId: string) {
    const r = this.state.leaveRequests.find((x) => x.id === id && x.member_id === memberId);
    if (r && r.status === 'PENDING') {
      r.status = 'CANCELLED';
      this.save();
    }
  }

  decideLeaveRequest(id: string, approve: boolean, note?: string) {
    const r = this.state.leaveRequests.find((x) => x.id === id);
    if (!r) return;
    r.status = approve ? 'APPROVED' : 'REJECTED';
    r.decided_at = new Date().toISOString();
    r.admin_note = note?.trim() || undefined;
    if (approve) {
      const type: ScheduleType = r.leave_type === 'SICK' ? 'SICK' : 'LEAVE';
      daysBetweenInclusive(r.start_date, r.end_date).forEach((d) => attendanceService.updateCellSchedule(r.member_id, d, type));
      if (r.leave_type === 'PAID') {
        const profile = this.getStaffProfile(r.member_id);
        this.saveStaffProfile({ ...profile, paid_leave_balance: Math.max(0, profile.paid_leave_balance - r.days) });
      }
    }
    this.pushMessage({
      sender_id: ADMIN_SENDER,
      recipient_id: r.member_id,
      category: 'SYSTEM',
      subject: `Pengajuan cuti ${approve ? 'disetujui' : 'ditolak'} (${r.start_date} – ${r.end_date})`,
      body: `${LEAVE_LABELS[r.leave_type]} selama ${r.days} hari ${approve ? 'telah disetujui dan masuk ke jadwal.' : 'tidak disetujui.'}${
        r.admin_note ? `\nCatatan admin: ${r.admin_note}` : ''
      }`
    });
    this.save();
  }

  // ----- messages -----
  private pushMessage(m: Omit<Message, 'id' | 'thread_id' | 'created_at' | 'read_by'> & { thread_id?: string }) {
    const id = uid('msg');
    const msg: Message = {
      ...m,
      id,
      thread_id: m.thread_id || id,
      created_at: new Date().toISOString(),
      read_by: [m.sender_id]
    };
    this.state.messages.push(msg);
    return msg;
  }

  sendMessage(input: { sender_id: string; recipient_id: string; category: MessageCategory; subject: string; body: string; thread_id?: string }): ActionResult {
    if (!input.body.trim()) return { ok: false, message: 'Isi pesan tidak boleh kosong.' };
    if (!input.thread_id && !input.subject.trim()) return { ok: false, message: 'Judul pesan wajib diisi.' };
    this.pushMessage({ ...input, subject: input.subject.trim(), body: input.body.trim() });
    this.save();
    return { ok: true, message: 'Pesan terkirim.' };
  }

  /** Messages a viewer (ADMIN or member id) is allowed to see. */
  private visibleTo(viewer: string) {
    if (viewer === ADMIN_SENDER) return this.state.messages;
    return this.state.messages.filter((m) => m.recipient_id === viewer || m.sender_id === viewer || m.recipient_id === BROADCAST);
  }

  getThreads(viewer: string) {
    const visible = this.visibleTo(viewer);
    const byThread = new Map<string, Message[]>();
    for (const m of visible) {
      const list = byThread.get(m.thread_id) || [];
      list.push(m);
      byThread.set(m.thread_id, list);
    }
    return [...byThread.values()]
      .map((list) => {
        list.sort((a, b) => a.created_at.localeCompare(b.created_at));
        const root = this.state.messages.find((m) => m.id === list[0].thread_id) || list[0];
        const last = list[list.length - 1];
        const unread = list.filter((m) => m.sender_id !== viewer && !m.read_by.includes(viewer)).length;
        return { root, messages: list, last, unread };
      })
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }

  markThreadRead(threadId: string, viewer: string) {
    let changed = false;
    for (const m of this.visibleTo(viewer)) {
      if (m.thread_id === threadId && !m.read_by.includes(viewer)) {
        m.read_by.push(viewer);
        changed = true;
      }
    }
    if (changed) this.save();
  }

  unreadCount(viewer: string) {
    return this.visibleTo(viewer).filter((m) => m.sender_id !== viewer && !m.read_by.includes(viewer)).length;
  }

  // ----- member session -----
  memberLogin(memberNumber: string, pin: string): ActionResult & { memberId?: string } {
    const member = attendanceService
      .getMembers()
      .find((m) => m.member_number.trim().toLowerCase() === memberNumber.trim().toLowerCase());
    if (!member) return { ok: false, message: 'Nomor pegawai tidak ditemukan.' };
    if (!member.is_active) return { ok: false, message: 'Akun tidak aktif. Hubungi admin.' };
    const profile = this.getStaffProfile(member.id);
    if (profile.pin !== pin.trim()) return { ok: false, message: 'PIN salah.' };
    try {
      sessionStorage.setItem(MEMBER_SESSION_KEY, member.id);
    } catch {
      // ignore
    }
    return { ok: true, message: 'Login berhasil', memberId: member.id };
  }

  getMemberSession(): string | null {
    try {
      const id = sessionStorage.getItem(MEMBER_SESSION_KEY);
      return id && attendanceService.getMembers().some((m) => m.id === id) ? id : null;
    } catch {
      return null;
    }
  }

  memberLogout() {
    try {
      sessionStorage.removeItem(MEMBER_SESSION_KEY);
    } catch {
      // ignore
    }
  }

  // ----- demo seed -----
  seedDemoStaff(): number {
    type Seed = [string, string, StaffProfile['employment_type'], StaffProfile['qualification'], number, string, string[], 'all' | 'day' | 'dayonly', number];
    // name, position, employment, qualification, level, floor, skills, shift pattern, max night
    const seeds: Seed[] = [
      ['Tanaka Yuki', 'Leader Unit A', 'SEISHAIN', 'FUKUSHISHI', 5, 'fl_1', ['sk_fukushi', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_suction', 'sk_night', 'sk_leader', 'sk_record'], 'all', 4],
      ['Sato Haruto', 'Care Worker Senior', 'SEISHAIN', 'FUKUSHISHI', 4, 'fl_2', ['sk_fukushi', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_record', 'sk_leader'], 'all', 6],
      ['Rina Putri Lestari', 'Care Worker', 'TOKUTEI', 'JITSUMU', 3, 'fl_1', ['sk_jitsumu', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_record', 'sk_med'], 'all', 6],
      ['Dewi Anggraini', 'Care Worker', 'TOKUTEI', 'SHONIN', 2, 'fl_2', ['sk_bath', 'sk_meal', 'sk_toilet', 'sk_night'], 'all', 6],
      ['Suzuki Aoi', 'Perawat', 'SEISHAIN', 'NURSE', 4, 'fl_1', ['sk_nurse', 'sk_med', 'sk_suction', 'sk_record'], 'dayonly', 0],
      ['Yamamoto Ken', 'Care Worker Senior', 'SEISHAIN', 'FUKUSHISHI', 4, 'fl_2', ['sk_fukushi', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_suction', 'sk_record', 'sk_leader'], 'all', 6],
      ['Budi Santoso', 'Care Worker & Supir', 'TOKUTEI', 'JITSUMU', 3, 'fl_1', ['sk_jitsumu', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_driver'], 'all', 6],
      ['Nakamura Emi', 'Care Worker (Part)', 'PART', 'SHONIN', 2, 'fl_1', ['sk_meal', 'sk_toilet', 'sk_bath'], 'day', 0],
      ['Kobayashi Riku', 'Care Worker', 'SEISHAIN', 'JITSUMU', 3, 'fl_2', ['sk_jitsumu', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_record', 'sk_med'], 'all', 6],
      ['Siti Nurhaliza', 'Care Worker', 'TOKUTEI', 'SHONIN', 2, 'fl_1', ['sk_meal', 'sk_toilet', 'sk_bath', 'sk_night'], 'all', 4],
      ['Watanabe Mei', 'Care Worker Senior', 'SEISHAIN', 'FUKUSHISHI', 4, 'fl_1', ['sk_fukushi', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_record', 'sk_med'], 'all', 6],
      ['Agus Pratama', 'Care Worker (Trainee)', 'TOKUTEI', 'NONE', 1, 'fl_2', ['sk_meal'], 'day', 0],
      ['Ito Sora', 'Care Worker', 'SEISHAIN', 'JITSUMU', 3, 'fl_2', ['sk_jitsumu', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_night', 'sk_record'], 'all', 6],
      ['Kato Hana', 'Asisten Perawatan (Part)', 'PART', 'NONE', 1, 'fl_1', ['sk_meal'], 'dayonly', 0],
      ['Fajar Ramadhan', 'Care Worker', 'TOKUTEI', 'SHONIN', 2, 'fl_2', ['sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night'], 'all', 6],
      ['Yoshida Takumi', 'Leader Unit B', 'SEISHAIN', 'FUKUSHISHI', 5, 'fl_2', ['sk_fukushi', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night', 'sk_leader', 'sk_record', 'sk_suction'], 'all', 3],
      ['Matsumoto Yui', 'Perawat', 'SEISHAIN', 'NURSE', 4, 'fl_2', ['sk_nurse', 'sk_med', 'sk_suction', 'sk_record'], 'dayonly', 0],
      ['Wulan Sari', 'Care Worker', 'TOKUTEI', 'JITSUMU', 3, 'fl_1', ['sk_jitsumu', 'sk_bath', 'sk_meal', 'sk_toilet', 'sk_transfer', 'sk_night'], 'all', 6]
    ];
    const existing = attendanceService.getMembers();
    const members: Omit<Member, 'organization_id'>[] = [];
    seeds.forEach(([name, position, emp, qual, level, floor, skills, pattern, maxNight], i) => {
      const number = `2026${String(i + 1).padStart(3, '0')}`;
      if (existing.some((m) => m.member_number === number)) return;
      const id = `mem_kaigo_${String(i + 1).padStart(3, '0')}`;
      members.push({
        id,
        member_number: number,
        full_name: name,
        department: this.state.floors.find((f) => f.id === floor)?.name || 'Lantai 1',
        position,
        is_active: true,
        active_token: `tok_${name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).slice(2, 10)}`
      });
      const allowed =
        pattern === 'all' ? [SH_HAYA, SH_NIKKIN, SH_OSO, SH_YAKIN] : pattern === 'day' ? [SH_HAYA, SH_NIKKIN, SH_OSO] : [SH_NIKKIN];
      const profile: StaffProfile = {
        member_id: id,
        employment_type: emp,
        qualification: qual,
        level,
        skill_ids: skills,
        allowed_shift_ids: allowed,
        home_floor_id: floor,
        can_float: level >= 3,
        max_night_per_month: maxNight,
        monthly_off_target: emp === 'PART' ? 12 : undefined,
        paid_leave_balance: emp === 'PART' ? 7 : 12,
        pin: number.slice(-4)
      };
      const idx = this.state.staff.findIndex((p) => p.member_id === id);
      if (idx >= 0) this.state.staff[idx] = profile;
      else this.state.staff.push(profile);
    });
    attendanceService.importMembers(members);
    if (members.length) {
      this.pushMessage({
        sender_id: ADMIN_SENDER,
        recipient_id: BROADCAST,
        category: 'NOTICE',
        subject: 'Selamat datang di portal staf',
        body: 'Di portal ini Anda bisa melihat jadwal shift, mengajukan libur yang diinginkan (希望休), mengajukan cuti, dan mengirim masukan ke atasan.'
      });
    }
    this.save();
    return members.length;
  }
}

export const facilityService = new FacilityService();
