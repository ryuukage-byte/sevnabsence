import React from 'react';
import type { Schedule, ScheduleType, Shift } from '../../types/attendance';

export const NON_SHIFT_TYPES: { type: ScheduleType; code: string; label: string; className: string }[] = [
  { type: 'OFF', code: '公', label: 'Libur rutin (公休)', className: 'off-pill' },
  { type: 'REQ_OFF', code: '希', label: 'Libur diinginkan (希望休)', className: 'req-pill' },
  { type: 'AKE', code: '明', label: 'Pulang shift malam (明け)', className: 'ake-pill' },
  { type: 'LEAVE', code: '有', label: 'Cuti (有給)', className: 'leave-pill' },
  { type: 'SICK', code: '病', label: 'Sakit (病欠)', className: 'sick-pill' },
  { type: 'HOLIDAY', code: '祝', label: 'Hari libur fasilitas', className: 'off-pill' }
];

export function describeSchedule(
  sch: Pick<Schedule, 'schedule_type' | 'shift_id'> | undefined | null,
  shifts: Shift[]
): { code: string; label: string; className: string; color?: string; shift?: Shift } {
  if (!sch) return { code: '·', label: 'Belum dijadwalkan', className: 'empty-pill' };
  if (sch.schedule_type === 'SHIFT') {
    const shift = shifts.find((s) => s.id === sch.shift_id);
    if (!shift) return { code: '?', label: 'Shift terhapus', className: 'empty-pill' };
    return {
      code: shift.code,
      label: `${shift.name} ${shift.start_time}–${shift.end_time}`,
      className: 'shift-pill',
      color: shift.color_code,
      shift
    };
  }
  const t = NON_SHIFT_TYPES.find((x) => x.type === sch.schedule_type);
  return t ? { code: t.code, label: t.label, className: t.className } : { code: '·', label: '', className: 'empty-pill' };
}

export const SchedulePill: React.FC<{
  sch?: Pick<Schedule, 'schedule_type' | 'shift_id'> | null;
  shifts: Shift[];
  suffix?: string;
}> = ({ sch, shifts, suffix }) => {
  const d = describeSchedule(sch, shifts);
  return (
    <div
      className={`matrix-pill ${d.className}`}
      style={d.color ? { backgroundColor: d.color, color: 'var(--text-on-brand)' } : undefined}
      title={d.label}
    >
      {d.code}
      {suffix && <sub className="pill-floor-sub">{suffix}</sub>}
    </div>
  );
};
