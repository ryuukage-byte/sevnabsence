import React from 'react';
import type { AttendanceStatus, ReviewStatus, ScheduleType } from '../../types/attendance';

/**
 * Status -> visual variant + label.
 * Colours live in CSS (`.status-pill--<variant>` in styles/15-components.css) and
 * resolve to the `--status-*` tokens in styles/00-tokens.css. Do not add colours here.
 */
type Variant = 'present' | 'late' | 'absent' | 'leave' | 'sick' | 'off' | 'info' | 'neutral';

const STATUS_MAP: Record<string, { variant: Variant; label: string }> = {
  PRESENT: { variant: 'present', label: 'Tepat Waktu' },
  LATE: { variant: 'late', label: 'Terlambat' },
  ABSENT: { variant: 'absent', label: 'Alpha / Tidak Hadir' },
  LEAVE: { variant: 'leave', label: 'Cuti' },
  SICK: { variant: 'sick', label: 'Sakit' },
  OFF: { variant: 'off', label: 'Libur (OFF)' },
  HOLIDAY: { variant: 'off', label: 'Hari Libur' },
  CORRECTED: { variant: 'info', label: 'Dikoreksi' },
  REVIEW_REQUIRED: { variant: 'late', label: 'Perlu Review' },
  PENDING_REVIEW: { variant: 'late', label: 'Perlu Review' },
  VERIFIED: { variant: 'present', label: 'Terverifikasi' },
  FLAGGED_INVALID: { variant: 'absent', label: 'Tidak Sah' },
  SHIFT: { variant: 'info', label: 'Masuk Shift' },
};

interface BadgeProps {
  status: AttendanceStatus | ReviewStatus | ScheduleType | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const entry = STATUS_MAP[status];
  const variant: Variant = entry?.variant ?? 'neutral';
  const label = entry?.label ?? status;

  return <span className={`status-pill pill-${size} status-pill--${variant}`}>{label}</span>;
};
