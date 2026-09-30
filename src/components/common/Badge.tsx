import React from 'react';
import type { AttendanceStatus, ReviewStatus, ScheduleType } from '../../types/attendance';

interface BadgeProps {
  status: AttendanceStatus | ReviewStatus | ScheduleType | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  let bg = '#F5F1E8';
  let text = '#5C5A57';
  let border = '#D8CDBE';
  let label = status;

  switch (status) {
    case 'PRESENT':
      bg = '#D6EEED';
      text = '#244E52';
      border = '#A3DEDB';
      label = 'Tepat Waktu';
      break;
    case 'LATE':
      bg = '#FFF0D1';
      text = '#6D4E1F';
      border = '#FFE099';
      label = 'Terlambat';
      break;
    case 'ABSENT':
      bg = '#F9E2DB';
      text = '#764B3A';
      border = '#F2C4B3';
      label = 'Alpha / Tidak Hadir';
      break;
    case 'LEAVE':
      bg = '#F5EEFD';
      text = '#4D366B';
      border = '#DCCCF3';
      label = 'Cuti';
      break;
    case 'SICK':
      bg = '#FFF0D1';
      text = '#6D4E1F';
      border = '#FFE099';
      label = 'Sakit';
      break;
    case 'OFF':
      bg = '#EEE8DB';
      text = '#6E6B67';
      border = '#D8CDBE';
      label = 'Libur (OFF)';
      break;
    case 'HOLIDAY':
      bg = '#FFE9DF';
      text = '#764B3A';
      border = '#FFBFA3';
      label = 'Hari Libur';
      break;
    case 'CORRECTED':
      bg = '#EAF5FD';
      text = '#375C73';
      border = '#A9D7F5';
      label = 'Dikoreksi';
      break;
    case 'REVIEW_REQUIRED':
    case 'PENDING_REVIEW':
      bg = '#FFF0D1';
      text = '#6D4E1F';
      border = '#FFD88A';
      label = 'Perlu Review';
      break;
    case 'VERIFIED':
      bg = '#D6EEED';
      text = '#244E52';
      border = '#7CCFCF';
      label = 'Terverifikasi';
      break;
    case 'FLAGGED_INVALID':
      bg = '#F9E2DB';
      text = '#764B3A';
      border = '#F2C4B3';
      label = 'Tidak Sah';
      break;
    case 'SHIFT':
      bg = '#EAF5FD';
      text = '#375C73';
      border = '#A9D7F5';
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
        border: `1.5px solid ${border}`,
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '3px 9px' : '5px 12px',
        borderRadius: '999px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(91, 78, 64, 0.05)'
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
