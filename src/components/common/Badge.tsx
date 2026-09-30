import React from 'react';
import type { AttendanceStatus, ReviewStatus, ScheduleType } from '../../types/attendance';

interface BadgeProps {
  status: AttendanceStatus | ReviewStatus | ScheduleType | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  let bg = '#F1F5F9';
  let text = '#475569';
  let label = status;

  switch (status) {
    case 'PRESENT':
      bg = '#ECFDF5';
      text = '#059669';
      label = 'Tepat Waktu';
      break;
    case 'LATE':
      bg = '#FEF3C7';
      text = '#D97706';
      label = 'Terlambat';
      break;
    case 'ABSENT':
      bg = '#FEE2E2';
      text = '#DC2626';
      label = 'Alpha / Tidak Hadir';
      break;
    case 'LEAVE':
      bg = '#EDE9FE';
      text = '#7C3AED';
      label = 'Cuti';
      break;
    case 'SICK':
      bg = '#FEF3C7';
      text = '#B45309';
      label = 'Sakit';
      break;
    case 'OFF':
      bg = '#F1F5F9';
      text = '#64748B';
      label = 'Libur (OFF)';
      break;
    case 'HOLIDAY':
      bg = '#FDF2F8';
      text = '#DB2777';
      label = 'Hari Libur Nasional';
      break;
    case 'CORRECTED':
      bg = '#E0F2FE';
      text = '#0284C7';
      label = 'Dikoreksi';
      break;
    case 'REVIEW_REQUIRED':
    case 'PENDING_REVIEW':
      bg = '#FFFBEB';
      text = '#D97706';
      label = 'Perlu Review';
      break;
    case 'VERIFIED':
      bg = '#ECFDF5';
      text = '#059669';
      label = 'Terverifikasi';
      break;
    case 'FLAGGED_INVALID':
      bg = '#FEE2E2';
      text = '#DC2626';
      label = 'Tidak Sah';
      break;
    case 'SHIFT':
      bg = '#EEF2FF';
      text = '#4F46E5';
      label = 'Masuk Shift';
      break;
    default:
      break;
  }

  return (
    <span
      className={`status-pill pill-${size}`}
      style={{
        backgroundColor: bg,
        color: text,
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 8px' : '5px 12px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: text,
          marginRight: 6
        }}
      />
      {label}
    </span>
  );
};
