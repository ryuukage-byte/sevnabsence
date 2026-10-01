import React from 'react';
import {
  Users,
  CheckCircle2,
  LogOut,
  Clock,
  AlertTriangle,
  FileQuestion,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  attendanceService,
  formatBranchTime,
  formatBranchDate,
  formatLateDuration
} from '../../services/attendanceService';
import { Badge } from '../common/Badge';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const members = attendanceService.getMembers();
  const todayRecords = attendanceService.getTodayRecords();
  const org = attendanceService.getOrganization();
  const tzLabel = org.timezone === 'Asia/Tokyo' ? 'JST' : 'WIB';

  const totalScheduled = members.length;
  const checkedIn = todayRecords.filter((r) => r.check_in_at).length;
  const checkedOut = todayRecords.filter((r) => r.check_out_at).length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const notYetArrived = Math.max(0, totalScheduled - checkedIn);
  const reviewRequired = todayRecords.filter(
    (r) => r.review_status === 'PENDING_REVIEW' || r.status === 'REVIEW_REQUIRED'
  ).length;

  const attendancePercent = totalScheduled > 0 ? Math.round((checkedIn / totalScheduled) * 100) : 0;

  // Helper for member initials
  const getInitials = (name?: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-today-dashboard">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Monitoring Hari Ini</h2>
          <p className="view-subtitle">
            Ringkasan kehadiran staf dan aktivitas presensi di {org.display_name} ({tzLabel}).
          </p>
        </div>
        <div className="admin-date-badge" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatBranchDate(new Date(), org.timezone, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Balanced 2 Hero KPI Cards + 4 Compact Secondary Tiles */}
      <div className="kpi-hero-grid">
        {/* Hero Card 1: Sudah Hadir */}
        <div className="kpi-hero-card kpi-hero-hadir" onClick={() => onNavigateTab('attendance')}>
          <div className="kpi-hero-header">
            <span className="kpi-hero-label">Sudah Hadir</span>
            <span className="kpi-hero-badge success">{attendancePercent}% Kehadiran</span>
          </div>
          <div className="kpi-hero-body">
            <div className="kpi-hero-number-wrapper">
              <span className="kpi-hero-number" style={{ color: 'var(--accent-sage)' }}>
                {checkedIn}
              </span>
              <span className="kpi-hero-total">/ {totalScheduled} staf</span>
            </div>
            <div className="kpi-progress-track">
              <div
                className="kpi-progress-bar"
                style={{ width: `${Math.min(100, attendancePercent)}%`, backgroundColor: 'var(--accent-sage)' }}
              />
            </div>
          </div>
          <div className="kpi-hero-footer">
            <span>{lateCount > 0 ? `${lateCount} terlambat masuk` : 'Semua tepat waktu'}</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Hero Card 2: Belum Hadir */}
        <div className="kpi-hero-card kpi-hero-belum" onClick={() => onNavigateTab('attendance')}>
          <div className="kpi-hero-header">
            <span className="kpi-hero-label">Belum Hadir</span>
            <span className="kpi-hero-badge warning">Menunggu Check-In</span>
          </div>
          <div className="kpi-hero-body">
            <div className="kpi-hero-number-wrapper">
              <span className="kpi-hero-number" style={{ color: 'var(--accent-terracotta)' }}>
                {notYetArrived}
              </span>
              <span className="kpi-hero-total">staf tersisa</span>
            </div>
            <div className="kpi-progress-track">
              <div
                className="kpi-progress-bar"
                style={{
                  width: `${totalScheduled > 0 ? (notYetArrived / totalScheduled) * 100 : 0}%`,
                  backgroundColor: 'var(--accent-terracotta)'
                }}
              />
            </div>
          </div>
          <div className="kpi-hero-footer">
            <span>{reviewRequired > 0 ? `${reviewRequired} perlu review jadwal` : 'Sesuai jadwal shift'}</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 4 Secondary Flat Metric Tiles */}
      <div className="kpi-secondary-grid">
        <div className="kpi-flat-tile" onClick={() => onNavigateTab('members')}>
          <div className="kpi-tile-icon kpi-tile-icon--neutral">
            <Users size={18} strokeWidth={2.2} />
          </div>
          <div className="kpi-tile-info">
            <span className="kpi-tile-label">Total Terjadwal</span>
            <span className="kpi-tile-number">{totalScheduled}</span>
          </div>
        </div>

        <div className="kpi-flat-tile" onClick={() => onNavigateTab('attendance')}>
          <div className="kpi-tile-icon kpi-tile-icon--terracotta">
            <LogOut size={18} strokeWidth={2.2} />
          </div>
          <div className="kpi-tile-info">
            <span className="kpi-tile-label">Sudah Pulang</span>
            <span className="kpi-tile-number">{checkedOut}</span>
          </div>
        </div>

        <div className="kpi-flat-tile" onClick={() => onNavigateTab('attendance')}>
          <div className="kpi-tile-icon kpi-tile-icon--caramel">
            <AlertTriangle size={18} strokeWidth={2.2} />
          </div>
          <div className="kpi-tile-info">
            <span className="kpi-tile-label">Terlambat</span>
            <span className="kpi-tile-number">{lateCount}</span>
          </div>
        </div>

        <div className="kpi-flat-tile" onClick={() => onNavigateTab('attendance')}>
          <div className="kpi-tile-icon kpi-tile-icon--danger">
            <FileQuestion size={18} strokeWidth={2.2} />
          </div>
          <div className="kpi-tile-info">
            <span className="kpi-tile-label">Perlu Review</span>
            <span className="kpi-tile-number">{reviewRequired}</span>
          </div>
        </div>
      </div>

      {/* Activity Feed & Shift Summary Columns */}
      <div className="admin-today-columns">
        {/* Latest Scan Activity */}
        <div className="activity-card">
          <div className="card-header-line">
            <h3>Aktivitas Presensi Terkini</h3>
            <button className="link-button" onClick={() => onNavigateTab('attendance')}>
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          {todayRecords.length === 0 ? (
            <div className="empty-activity-box">
              <Clock size={36} color="var(--border-strong)" />
              <p>Belum ada presensi yang tercatat hari ini.</p>
            </div>
          ) : (
            <div className="activity-list">
              {todayRecords.slice(0, 6).map((rec) => {
                const isOut = Boolean(rec.check_out_at);
                const timeIso = rec.check_out_at || rec.check_in_at;
                const timeStr = formatBranchTime(timeIso, org.timezone);
                const initials = getInitials(rec.member_name);

                return (
                  <div key={rec.id} className="activity-item">
                    {/* Explicit Avatar with Initials Fallback */}
                    <div className={`activity-avatar-tile ${isOut ? 'pulang' : 'masuk'}`}>
                      {initials}
                    </div>

                    <div className="activity-details">
                      <div className="activity-name-row">
                        <span className="activity-name">{rec.member_name}</span>
                        <span className="activity-dept-tag">{rec.department || 'Operasional'}</span>
                      </div>
                      <span className="activity-meta">
                        {rec.shift_name} • {isOut ? 'Presensi Pulang' : 'Presensi Masuk'}
                      </span>
                    </div>

                    <div className="activity-time">
                      <span className="time-val" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {timeStr} <small>{tzLabel}</small>
                      </span>
                      <Badge status={rec.status} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Structured Row: Shift Aktif Perusahaan */}
        <div className="shifts-summary-card">
          <div className="card-header-line">
            <h3>Shift Aktif Perusahaan</h3>
            <button className="link-button" onClick={() => onNavigateTab('shifts')}>
              Kelola Shift <ArrowRight size={14} />
            </button>
          </div>

          <div className="shifts-structured-table">
            <div className="shifts-table-header">
              <span>Shift</span>
              <span>Jam Operasional</span>
              <span style={{ textAlign: 'right' }}>Toleransi</span>
            </div>

            <div className="shifts-rows-wrapper">
              {attendanceService.getShifts().map((shift) => (
                <div key={shift.id} className="shift-row-item">
                  <div className="shift-name-cell">
                    <span
                      className="shift-color-indicator"
                      style={{ backgroundColor: shift.color_code }}
                    />
                    <div className="shift-name-block">
                      <strong>{shift.name}</strong>
                      <span className="shift-code-pill">Kode: {shift.code}</span>
                    </div>
                  </div>

                  <div className="shift-hours-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {shift.start_time} – {shift.end_time} <small>{tzLabel}</small>
                  </div>

                  <div className="shift-policy-cell">
                    <span className="tolerance-badge">
                      +{shift.late_tolerance_mins}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
