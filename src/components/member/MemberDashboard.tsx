import React, { useState } from 'react';
import { Calendar, Clock, History, AlertCircle, QrCode, User, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';
import { MemberSchedule } from './MemberSchedule';
import { MemberHistory } from './MemberHistory';

export const MemberDashboard: React.FC = () => {
  const members = attendanceService.getMembers();
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'history'>('today');
  const [showQRModal, setShowQRModal] = useState(false);

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const todayRecords = attendanceService.getTodayRecords();
  const memberTodayRecord = todayRecords.find((r) => r.member_id === currentMember?.id);
  const shifts = attendanceService.getShifts();
  const defaultShift = shifts[0];

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="member-portal-container">
      {/* Top Profile Card */}
      <div className="member-header-card">
        <div className="member-avatar-wrapper">
          <div className="member-avatar">
            {currentMember?.avatar_url ? (
              <img
                src={currentMember.avatar_url}
                alt={currentMember.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{currentMember?.full_name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Portal Karyawan
            </div>
            <h1 className="member-name">{currentMember?.full_name}</h1>
            <div className="member-subtext">
              <span className="meta-pill">{currentMember?.position}</span>
              <span className="meta-pill">{currentMember?.department}</span>
              <span className="meta-pill font-mono">{currentMember?.member_number}</span>
            </div>
          </div>
        </div>

        {/* Member Switcher & QR Button */}
        <div className="member-actions-top">
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="member-select-dropdown"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.department})
              </option>
            ))}
          </select>

          <button className="btn-show-qr" onClick={() => setShowQRModal(true)}>
            <QrCode size={18} strokeWidth={2} />
            <span>Kartu QR Saya</span>
          </button>
        </div>
      </div>

      {/* Modern Skeuomorphic Segmented Tabs */}
      <div className="member-tabs-nav">
        <button
          className={`member-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <Clock size={16} strokeWidth={2.2} />
          <span>Hari Ini</span>
        </button>
        <button
          className={`member-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={16} strokeWidth={2.2} />
          <span>Jadwal Bulanan</span>
        </button>
        <button
          className={`member-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} strokeWidth={2.2} />
          <span>Riwayat Presensi</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <div className="member-today-content">
          <div className="member-today-grid">
            {/* Today Status Card */}
            <div className="today-status-card">
              <div className="card-top-tag">
                <Clock size={15} strokeWidth={2.2} />
                <span>Status Kehadiran Hari Ini</span>
              </div>
              <div className="today-date-text">{dateStr}</div>

              <div style={{ margin: '14px 0 20px' }}>
                <Badge
                  status={
                    memberTodayRecord?.status ||
                    (memberTodayRecord?.check_in_at ? 'PRESENT' : 'Belum Presensi')
                  }
                  size="md"
                />
              </div>

              {/* Time Boxes */}
              <div className="today-timestamps-row">
                <div className="timestamp-box masuk-box">
                  <span className="box-label">Jam Masuk</span>
                  <span className="box-time">
                    {memberTodayRecord?.check_in_at
                      ? new Date(memberTodayRecord.check_in_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '--:--'}
                  </span>
                  <span className="box-note">
                    {memberTodayRecord?.late_minutes
                      ? `Terlambat ${memberTodayRecord.late_minutes} menit`
                      : memberTodayRecord?.check_in_at
                      ? 'Tepat Waktu'
                      : 'Belum presensi masuk'}
                  </span>
                </div>

                <div className="timestamp-box pulang-box">
                  <span className="box-label">Jam Pulang</span>
                  <span className="box-time">
                    {memberTodayRecord?.check_out_at
                      ? new Date(memberTodayRecord.check_out_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '--:--'}
                  </span>
                  <span className="box-note">
                    {memberTodayRecord?.work_duration_minutes
                      ? `Durasi: ${Math.floor(memberTodayRecord.work_duration_minutes / 60)}j ${
                          memberTodayRecord.work_duration_minutes % 60
                        }m`
                      : 'Belum presensi pulang'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expected Shift Details Card */}
            <div className="today-shift-card">
              <h3 className="card-heading">Jadwal Shift Kerja</h3>

              <div className="shift-detail-item">
                <span className="detail-label">Penugasan Shift:</span>
                <span className="detail-value">{defaultShift?.name || 'Shift A (Pagi)'}</span>
              </div>
              <div className="shift-detail-item">
                <span className="detail-label">Jam Operasional:</span>
                <span className="detail-value font-mono">
                  {defaultShift?.start_time} - {defaultShift?.end_time} WIB
                </span>
              </div>
              <div className="shift-detail-item">
                <span className="detail-label">Toleransi Terlambat:</span>
                <span className="detail-value">{defaultShift?.late_tolerance_mins} Menit</span>
              </div>
              <div className="shift-detail-item">
                <span className="detail-label">Toleransi Datang Awal:</span>
                <span className="detail-value">{defaultShift?.early_tolerance_mins} Menit</span>
              </div>

              <div className="shift-card-notice">
                <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>
                  Gunakan kartu QR fisik atau layar ponsel Anda pada tablet Kiosk di pintu masuk kantor.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <MemberSchedule memberId={currentMember.id} memberName={currentMember.full_name} />
      )}

      {activeTab === 'history' && (
        <MemberHistory memberId={currentMember.id} memberName={currentMember.full_name} />
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {attendanceService.getOrganization().display_name}
              </span>
              <button className="btn-close" onClick={() => setShowQRModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--border-light)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
              display: 'inline-block',
              margin: '0 auto 16px'
            }}>
              {currentMember.active_token && (
                <QRCodeSVG
                  value={currentMember.active_token}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {currentMember.full_name}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {currentMember.member_number} • {currentMember.department}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: 14 }}>
              Tunjukkan kode QR ini ke kamera Kiosk untuk merekam presensi.
            </p>

            <button
              className="btn-auth-submit"
              onClick={() => setShowQRModal(false)}
              style={{ marginTop: 20 }}
            >
              Tutup Kartu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
