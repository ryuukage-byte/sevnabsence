import React from 'react';
import {
  Users,
  CheckCircle2,
  LogOut,
  Clock,
  AlertTriangle,
  Calendar,
  FileQuestion,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const members = attendanceService.getMembers();
  const todayRecords = attendanceService.getTodayRecords();

  const totalScheduled = members.length;
  const checkedIn = todayRecords.filter((r) => r.check_in_at).length;
  const checkedOut = todayRecords.filter((r) => r.check_out_at).length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const notYetArrived = Math.max(0, totalScheduled - checkedIn);
  const reviewRequired = todayRecords.filter(
    (r) => r.review_status === 'PENDING_REVIEW' || r.status === 'REVIEW_REQUIRED'
  ).length;

  return (
    <div className="admin-today-dashboard">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Monitoring Hari Ini</h2>
          <p className="view-subtitle">
            Ringkasan kehadiran staf dan aktivitas presensi secara real-time.
          </p>
        </div>
        <div className="admin-date-badge">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigateTab('members')}>
          <div className="stat-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
            <Users size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Terjadwal</span>
            <span className="stat-number">{totalScheduled}</span>
            <span className="stat-hint">Staf aktif hari ini</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('attendance')}>
          <div className="stat-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Sudah Hadir (Masuk)</span>
            <span className="stat-number" style={{ color: '#059669' }}>{checkedIn}</span>
            <span className="stat-hint">
              {Math.round((checkedIn / totalScheduled) * 100 || 0)}% dari total
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('attendance')}>
          <div className="stat-icon-box" style={{ background: '#FFF1F2', color: '#E11D48' }}>
            <LogOut size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Sudah Pulang</span>
            <span className="stat-number" style={{ color: '#E11D48' }}>{checkedOut}</span>
            <span className="stat-hint">Selesai shift kerja</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('attendance')}>
          <div className="stat-icon-box" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <AlertTriangle size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Terlambat</span>
            <span className="stat-number" style={{ color: '#D97706' }}>{lateCount}</span>
            <span className="stat-hint">Melebihi toleransi</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#F8FAFC', color: '#64748B' }}>
            <Clock size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Belum Hadir</span>
            <span className="stat-number" style={{ color: '#334155' }}>{notYetArrived}</span>
            <span className="stat-hint">Menunggu check-in</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigateTab('attendance')}>
          <div className="stat-icon-box" style={{ background: '#FAF5FF', color: '#9333EA' }}>
            <FileQuestion size={22} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Perlu Review</span>
            <span className="stat-number" style={{ color: '#9333EA' }}>{reviewRequired}</span>
            <span className="stat-hint">Verifikasi anti-joki</span>
          </div>
        </div>
      </div>

      {/* Activity Feed & Quick Actions */}
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
              <Clock size={36} color="#94A3B8" />
              <p>Belum ada presensi yang tercatat hari ini.</p>
            </div>
          ) : (
            <div className="activity-list">
              {todayRecords.slice(0, 6).map((rec) => (
                <div key={rec.id} className="activity-item">
                  <div
                    className={`activity-dot ${
                      rec.check_out_at ? 'dot-pulang' : 'dot-masuk'
                    }`}
                  />
                  <div className="activity-details">
                    <span className="activity-name">{rec.member_name}</span>
                    <span className="activity-meta">
                      {rec.department} • {rec.shift_name}
                    </span>
                  </div>
                  <div className="activity-time">
                    <span className="time-val">
                      {new Date(rec.check_out_at || rec.check_in_at || '').toLocaleTimeString(
                        'id-ID',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                    <Badge status={rec.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Shift Overview */}
        <div className="shifts-summary-card">
          <div className="card-header-line">
            <h3>Shift Aktif Perusahaan</h3>
            <button className="link-button" onClick={() => onNavigateTab('shifts')}>
              Kelola Shift <ArrowRight size={14} />
            </button>
          </div>

          <div className="shifts-list">
            {attendanceService.getShifts().map((shift) => (
              <div key={shift.id} className="shift-overview-item">
                <div
                  className="shift-color-bar"
                  style={{ backgroundColor: shift.color_code }}
                />
                <div className="shift-info-col">
                  <span className="shift-name-text">{shift.name}</span>
                  <span className="shift-hours-text">
                    {shift.start_time} - {shift.end_time} WIB
                  </span>
                </div>
                <div className="shift-tolerance-tag">
                  Toleransi: +{shift.late_tolerance_mins}m
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
