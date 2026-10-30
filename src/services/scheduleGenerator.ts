// Automatic monthly shift builder (勤務表 自動作成) for a kaigo facility.
// Greedy day-by-day assignment that honours, in priority order:
//   1. approved leave / sick / requested days off (fixed cells)
//   2. 夜勤 -> 明け -> 公休 rotation and carry-over from the previous month
//   3. per-floor x per-shift minimum staffing (weekend override)
//   4. each staff member's allowed shifts, home floor, max nights, max consecutive days
//   5. skill coverage needed by room tasks of that weekday (bath, suction, leader ...)
//   6. fair distribution towards each person's monthly off-day target
import { attendanceService } from './attendanceService';
import { facilityService, toDateStr } from './facilityService';
import type { Schedule, ScheduleType, Shift } from '../types/attendance';
import type { GeneratorWarning, StaffProfile } from '../types/facility';

export type GeneratedCell = Omit<Schedule, 'id' | 'organization_id'>;

export interface MemberStat {
  member_id: string;
  work: number;
  off: number;
  nights: number;
  leave: number;
  target_off: number;
}

export interface GeneratorResult {
  year: number;
  month: number;
  cells: GeneratedCell[];
  warnings: GeneratorWarning[];
  stats: MemberStat[];
  filledSlots: number;
  requiredSlots: number;
}

const WORKING: ScheduleType[] = ['SHIFT', 'AKE'];

export function generateMonthSchedule(year: number, month: number): GeneratorResult {
  const rules = facilityService.getRules();
  const floors = facilityService.getFloors();
  const coverage = facilityService.getCoverage();
  const tasks = facilityService.getTasks();
  const rooms = facilityService.getRooms();
  const shifts = attendanceService.getShifts();
  const members = attendanceService.getMembers().filter((m) => m.is_active);
  const N = new Date(year, month, 0).getDate();
  const warnings: GeneratorWarning[] = [];

  const dateOf = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
  const nightId = rules.night_shift_id;
  const profiles = new Map<string, StaffProfile>();
  members.forEach((m) => profiles.set(m.id, facilityService.getStaffProfile(m.id)));

  const missingIdentity = members.filter((m) => !facilityService.hasStaffProfile(m.id));
  if (missingIdentity.length) {
    warnings.push({
      severity: 'warning',
      message: `${missingIdentity.length} staf belum punya identitas (skill/shift). Dipakai pengaturan default: ${missingIdentity
        .map((m) => m.full_name)
        .join(', ')}.`
    });
  }

  // ---- grid & fixed cells ----
  const grid = new Map<string, (GeneratedCell | null)[]>();
  members.forEach((m) => grid.set(m.id, Array(N).fill(null)));
  const setCell = (memberId: string, d: number, type: ScheduleType, shiftId?: string, floorId?: string) => {
    const row = grid.get(memberId);
    if (!row || d < 0 || d >= N) return;
    row[d] = { member_id: memberId, schedule_date: dateOf(d), schedule_type: type, shift_id: shiftId, floor_id: floorId };
  };

  // keep leave / sick / requested-off already written into this month (approvals write them)
  const existing = attendanceService.getSchedules(year, month);
  existing.forEach((s) => {
    if (['LEAVE', 'SICK', 'REQ_OFF', 'HOLIDAY'].includes(s.schedule_type)) {
      setCell(s.member_id, Number(s.schedule_date.slice(8, 10)) - 1, s.schedule_type);
    }
  });
  const mk = `${year}-${String(month).padStart(2, '0')}`;
  facilityService.getOffRequests({ month: mk, status: 'APPROVED' }).forEach((r) => {
    setCell(r.member_id, Number(r.date.slice(8, 10)) - 1, 'REQ_OFF');
  });
  facilityService.getLeaveRequests({ status: 'APPROVED' }).forEach((r) => {
    for (let d = 0; d < N; d++) {
      const ds = dateOf(d);
      if (ds >= r.start_date && ds <= r.end_date) setCell(r.member_id, d, r.leave_type === 'SICK' ? 'SICK' : 'LEAVE');
    }
  });
  const pending = facilityService.getOffRequests({ month: mk, status: 'PENDING' }).length;
  if (pending) {
    warnings.push({ severity: 'info', message: `${pending} pengajuan libur bulan ini masih PENDING dan belum diperhitungkan. Proses di menu Pengajuan.` });
  }

  // ---- carry-over from previous month ----
  const streak = new Map<string, number>();
  const lastShift = new Map<string, string | undefined>();
  const prev = new Date(year, month - 1, 0); // last day of previous month
  members.forEach((m) => {
    let s = 0;
    for (let back = 0; back < 7; back++) {
      const dd = new Date(prev);
      dd.setDate(prev.getDate() - back);
      const sch = attendanceService.getMemberSchedule(m.id, toDateStr(dd));
      if (sch && WORKING.includes(sch.schedule_type)) s++;
      else break;
    }
    streak.set(m.id, s);
    const lastSch = attendanceService.getMemberSchedule(m.id, toDateStr(prev));
    lastShift.set(m.id, lastSch?.schedule_type === 'SHIFT' ? lastSch.shift_id : undefined);
    if (lastSch?.schedule_type === 'SHIFT' && lastSch.shift_id === nightId) {
      setCell(m.id, 0, 'AKE');
      if (rules.off_after_ake && !grid.get(m.id)![1]) setCell(m.id, 1, 'OFF');
    }
    const prev2 = new Date(prev);
    prev2.setDate(prev.getDate() - 1);
    const sch2 = attendanceService.getMemberSchedule(m.id, toDateStr(prev2));
    if (sch2?.schedule_type === 'SHIFT' && sch2.shift_id === nightId && rules.off_after_ake && !grid.get(m.id)![0]) {
      setCell(m.id, 0, 'OFF');
    }
  });

  // ---- per-member targets ----
  const work = new Map<string, number>();
  const nights = new Map<string, number>();
  const offs = new Map<string, number>();
  const targetWork = new Map<string, number>();
  const targetOff = new Map<string, number>();
  members.forEach((m) => {
    const p = profiles.get(m.id)!;
    const row = grid.get(m.id)!;
    const leaveDays = row.filter((c) => c && (c.schedule_type === 'LEAVE' || c.schedule_type === 'SICK')).length;
    const tOff = p.monthly_off_target ?? rules.monthly_off_days;
    targetOff.set(m.id, tOff);
    targetWork.set(m.id, Math.max(0, N - tOff - leaveDays));
    work.set(m.id, 0);
    nights.set(m.id, 0);
    offs.set(m.id, 0);
  });

  // shift processing order: night first (scarcest), then early, late, the rest
  const order = [...shifts].sort((a, b) => rank(a) - rank(b));
  function rank(s: Shift) {
    if (s.id === nightId) return 0;
    if (s.id === rules.early_shift_id) return 1;
    if (s.id === rules.late_shift_id) return 2;
    return 3;
  }
  const extraShift = shifts.find((s) => s.code === '日') || shifts.find((s) => s.id !== nightId);

  let requiredSlots = 0;
  let filledSlots = 0;
  const unmet: string[] = [];
  const taskGaps = new Map<string, number[]>(); // task id -> days lacking qualified staff

  for (let d = 0; d < N; d++) {
    const dow = new Date(year, month - 1, d + 1).getDay();
    const weekend = dow === 0 || dow === 6;
    // who is on (floor, shift) today
    const onDuty = new Map<string, string[]>(); // `${floor}|${shift}` -> member ids
    const key = (f: string, s: string) => `${f}|${s}`;

    const isFree = (memberId: string) => !grid.get(memberId)![d];
    const canWork = (memberId: string, shiftId: string) => {
      const p = profiles.get(memberId)!;
      if (!isFree(memberId)) return false;
      if (!p.allowed_shift_ids?.includes(shiftId)) return false;
      if ((streak.get(memberId) || 0) >= rules.max_consecutive_work_days) return false;
      if (rules.forbid_late_to_early && shiftId === rules.early_shift_id && lastShift.get(memberId) === rules.late_shift_id) return false;
      if (shiftId === nightId) {
        if ((nights.get(memberId) || 0) >= (p.max_night_per_month || 0)) return false;
        const row = grid.get(memberId)!;
        if (d + 1 < N && row[d + 1]) return false; // tomorrow must be free for 明け
        if ((streak.get(memberId) || 0) + 2 > rules.max_consecutive_work_days) return false;
      }
      return true;
    };

    // skill needs per floor+shift for today's tasks
    const todaysTasks = tasks.filter((t) => t.days_of_week.includes(dow));

    const assign = (memberId: string, shift: Shift, floorId: string) => {
      setCell(memberId, d, 'SHIFT', shift.id, floorId);
      const k = key(floorId, shift.id);
      onDuty.set(k, [...(onDuty.get(k) || []), memberId]);
      if (shift.id === nightId) {
        nights.set(memberId, (nights.get(memberId) || 0) + 1);
        if (d + 1 < N) setCell(memberId, d + 1, 'AKE');
        if (rules.off_after_ake && d + 2 < N && !grid.get(memberId)![d + 2]) setCell(memberId, d + 2, 'OFF');
      }
    };

    const scoreFor = (memberId: string, shift: Shift, floorId: string) => {
      const p = profiles.get(memberId)!;
      const tw = targetWork.get(memberId) || 1;
      const w = work.get(memberId) || 0;
      let score = (w / Math.max(1, tw)) * 100;
      if (w >= tw) score += 1000;
      if (p.home_floor_id && p.home_floor_id !== floorId) {
        if (!p.can_float) return Number.POSITIVE_INFINITY;
        score += 45;
      }
      // skills needed by today's tasks on this floor during this shift, not yet covered
      const floorRooms = rooms.filter((r) => r.floor_id === floorId).map((r) => r.id);
      const assigned = onDuty.get(key(floorId, shift.id)) || [];
      for (const t of todaysTasks) {
        if (!floorRooms.includes(t.room_id) || !t.shift_ids.includes(shift.id)) continue;
        for (const skill of t.required_skill_ids) {
          const covered = assigned.filter((id) => profiles.get(id)!.skill_ids.includes(skill)).length;
          if (covered < 1 && p.skill_ids.includes(skill)) score -= 25;
        }
      }
      // one experienced person per night / per floor-shift
      if (assigned.every((id) => (profiles.get(id)!.level || 1) < 3) && (p.level || 1) >= 3) score -= shift.id === nightId ? 30 : 10;
      if (shift.id === nightId) score += (nights.get(memberId) || 0) * 8;
      score += (streak.get(memberId) || 0) * 4;
      score += Math.random() * 6;
      return score;
    };

    // 1) required coverage
    for (const shift of order) {
      for (const floor of floors) {
        const rule = coverage.find((c) => c.floor_id === floor.id && c.shift_id === shift.id);
        if (!rule) continue;
        const need = weekend && rule.weekend_min_staff !== undefined ? rule.weekend_min_staff : rule.min_staff;
        requiredSlots += need;
        for (let slot = 0; slot < need; slot++) {
          let best: string | null = null;
          let bestScore = Number.POSITIVE_INFINITY;
          for (const m of members) {
            if (!canWork(m.id, shift.id)) continue;
            const sc = scoreFor(m.id, shift, floor.id);
            if (sc < bestScore) {
              bestScore = sc;
              best = m.id;
            }
          }
          if (best) {
            assign(best, shift, floor.id);
            filledSlots++;
          } else {
            unmet.push(`${d + 1}|${floor.name}|${shift.code}`);
          }
        }
      }
    }

    // 2) extra day staff for people behind their monthly work pace (prefer heavy-task days)
    if (extraShift) {
      for (const m of members) {
        const p = profiles.get(m.id)!;
        if (!isFree(m.id)) continue;
        const remaining = (targetWork.get(m.id) || 0) - (work.get(m.id) || 0);
        const daysLeft = N - d;
        const freeLeft = grid.get(m.id)!.slice(d).filter((c) => !c).length;
        if (remaining <= 0) continue;
        const pace = remaining / Math.max(1, freeLeft);
        const must = remaining >= freeLeft;
        if (!must && pace < 0.78 && daysLeft > 2) continue;
        const options = [extraShift, ...shifts.filter((s) => s.id !== extraShift.id && s.id !== nightId)];
        const pick = options.find((s) => canWork(m.id, s.id));
        if (pick) assign(m.id, pick, p.home_floor_id || floors[0]?.id);
      }
    }

    // 3) close the day: unassigned -> 公休, update trackers
    for (const m of members) {
      const row = grid.get(m.id)!;
      if (!row[d]) setCell(m.id, d, 'OFF');
      const c = row[d]!;
      if (WORKING.includes(c.schedule_type)) {
        work.set(m.id, (work.get(m.id) || 0) + 1);
        streak.set(m.id, (streak.get(m.id) || 0) + 1);
      } else {
        streak.set(m.id, 0);
        if (c.schedule_type === 'OFF' || c.schedule_type === 'REQ_OFF' || c.schedule_type === 'HOLIDAY') offs.set(m.id, (offs.get(m.id) || 0) + 1);
      }
      lastShift.set(m.id, c.schedule_type === 'SHIFT' ? c.shift_id : undefined);
    }

    // 4) skill check for today's tasks
    for (const t of todaysTasks) {
      const floorId = rooms.find((r) => r.id === t.room_id)?.floor_id;
      if (!floorId) continue;
      const staff = t.shift_ids.flatMap((sid) => onDuty.get(key(floorId, sid)) || []);
      const qualified = staff.filter((id) => t.required_skill_ids.every((sk) => profiles.get(id)!.skill_ids.includes(sk))).length;
      if (qualified < t.min_staff) {
        taskGaps.set(t.id, [...(taskGaps.get(t.id) || []), d + 1]);
      }
    }
  }

  // ---- warnings ----
  if (unmet.length) {
    const grouped = new Map<string, number[]>();
    unmet.forEach((u) => {
      const [day, floor, code] = u.split('|');
      const k = `${floor} · shift ${code}`;
      grouped.set(k, [...(grouped.get(k) || []), Number(day)]);
    });
    grouped.forEach((days, k) =>
      warnings.push({
        severity: 'error',
        message: `Kekurangan staf ${k} pada tgl ${[...new Set(days)].join(', ')}. Tambah staf yang bisa shift ini atau turunkan kebutuhan.`
      })
    );
  }
  taskGaps.forEach((days, taskId) => {
    const t = tasks.find((x) => x.id === taskId)!;
    const room = rooms.find((r) => r.id === t.room_id);
    const floor = floors.find((f) => f.id === room?.floor_id);
    const skillNames = t.required_skill_ids
      .map((id) => facilityService.getSkills().find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(' + ');
    warnings.push({
      severity: 'warning',
      message: `Tugas "${t.name}" (${room?.name}, ${floor?.name}) butuh ${t.min_staff} staf${
        skillNames ? ` ber-skill ${skillNames}` : ''
      }, kurang pada tgl ${days.join(', ')}.`
    });
  });

  const stats: MemberStat[] = members.map((m) => {
    const row = grid.get(m.id)!;
    return {
      member_id: m.id,
      work: row.filter((c) => c && WORKING.includes(c.schedule_type)).length,
      off: row.filter((c) => c && ['OFF', 'REQ_OFF', 'HOLIDAY'].includes(c.schedule_type)).length,
      nights: nights.get(m.id) || 0,
      leave: row.filter((c) => c && (c.schedule_type === 'LEAVE' || c.schedule_type === 'SICK')).length,
      target_off: targetOff.get(m.id) || 0
    };
  });
  stats.forEach((s) => {
    const diff = s.off - s.target_off;
    if (Math.abs(diff) >= 2) {
      const name = members.find((m) => m.id === s.member_id)?.full_name;
      warnings.push({
        severity: 'info',
        message: `${name}: ${s.off} hari libur (target ${s.target_off}, ${diff > 0 ? 'lebih' : 'kurang'} ${Math.abs(diff)}).`
      });
    }
  });
  if (!members.length) warnings.push({ severity: 'error', message: 'Belum ada staf aktif. Tambahkan staf atau muat data demo.' });
  if (!warnings.some((w) => w.severity !== 'info')) {
    warnings.unshift({ severity: 'info', message: 'Semua kebutuhan lantai, shift dan skill terpenuhi.' });
  }

  const cells = members.flatMap((m) => grid.get(m.id)!.filter((c): c is GeneratedCell => !!c));
  return { year, month, cells, warnings, stats, filledSlots, requiredSlots };
}
