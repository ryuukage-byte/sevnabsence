import React, { useState } from 'react';
import { Calendar, Clock, History, AlertCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';
import { MemberSchedule } from './MemberSchedule';
import { MemberHistory } from './MemberHistory';
import type { Member, AttendanceRecord, Shift } from '../../types/attendance';

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
      {/* Top Profile Header styled as an Illustrated Dossier Notebook */}
      <div className="member-dossier-card-wrap">
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
            <div className="member-meta">
              <div className="member-greeting">
                <img
                  src="/assets/scrapbook/badge_paw.png"
                  alt="paw"
                  style={{ width: 16, height: 16, marginRight: 4 }}
                />
                Dossier Karyawan
              </div>
              <h1 className="member-name">{currentMember?.full_name}</h1>
              <div className="member-subtext">
                <span className="meta-tag">{currentMember?.position}</span>
                <span className="meta-tag">{currentMember?.department}</span>
                <span className="meta-tag font-mono">{currentMember?.member_number}</span>
              </div>
            </div>
          </div>

          {/* Member Selector (for demo/testing convenience) & QR button */}
          <div className="member-actions-top">
            <div className="member-switcher">
              <label>Pilih Profil Staf:</label>
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
            </div>

            <button className="btn-show-qr" onClick={() => setShowQRModal(true)}>
              <QrCode size={18} />
              <span>Buka Kartu QR</span>
            </button>
          </div>
        </div>

        {/* Decorative Scrapbook Corner Tape & Clips */}
        <img
          src="/assets/scrapbook/clip_paperclip_bronze.png"
          alt="Paperclip"
          className="dossier-corner-clip"
        />
        <img
          src="/assets/scrapbook/washi_plaid_yellow.png"
          alt="Washi Tape"
          className="dossier-corner-washi"
        />
      </div>

      {/* Illustrated Tab Navigation */}
      <div className="member-tabs">
        <button
          className={`member-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <img
            src="/assets/scrapbook/tab_home.png"
            alt="Hari Ini"
            className="member-tab-mini-img"
          />
          <span>Hari Ini</span>
        </button>
        <button
          className={`member-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <img
            src="/assets/scrapbook/tab_admin.png"
            alt="Jadwal Bulanan"
            className="member-tab-mini-img"
          />
          <span>Jadwal Bulanan</span>
        </button>
        <button
          className={`member-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <img
            src="/assets/scrapbook/tab_member.png"
            alt="Riwayat Presensi"
            className="member-tab-mini-img"
          />
          <span>Riwayat Presensi</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <div className="member-today-content">
          <div className="member-today-grid">
            {/* Status Card with Scrapbook Health Hearts */}
            <div className="today-status-card">
              <div className="card-top-tag">
                <Clock size={16} /> Status Presensi Hari Ini
              </div>
              <div className="today-date-text">{dateStr}</div>

              <div className="today-status-badge-row">
                <Badge
                  status={
                    memberTodayRecord?.status ||
                    (memberTodayRecord?.check_in_at ? 'PRESENT' : 'Belum Presensi')
                  }
                  size="md"
                />
                {/* Illustrated Health Hearts Status Stamp */}
                <div className="attendance-streak-hearts-wrap" title="Status Kehadiran & Kedisiplinan">
                  <img
                    src="/assets/scrapbook/hearts_status.png"
                    alt="Attendance Hearts"
                    className="attendance-hearts-img"
                  />
                  <span className="hearts-label">Disiplin Shift</span>
                </div>
              </div>

              {/* Check-in & Check-out Summary Boxes */}
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
                      : 'Belum scan masuk'}
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
                      : 'Belum scan pulang'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expected Shift Details styled with Illustrated Ticket Banner */}
            <div className="today-shift-card">
              <div className="shift-ticket-header">
                <img
                  src="/assets/scrapbook/panel_ticket_voucher.png"
                  alt="Shift Pass Ticket"
                  className="shift-ticket-banner-img"
                />
                <div className="shift-ticket-header-content">
                  <span className="ticket-tag">TIKET TUGAS RESMI</span>
                  <h3 className="card-heading">{defaultShift?.name || 'Shift A'}</h3>
                </div>
              </div>

              <div className="shift-detail-item">
                <span className="detail-label">Jam Kerja Resmi:</span>
                <span className="detail-value font-mono">
                  {defaultShift?.start_time} - {defaultShift?.end_time} WIB
                </span>
              </div>
              <div className="shift-detail-item">
                <span className="detail-label">Toleransi Keterlambatan:</span>
                <span className="detail-value">{defaultShift?.late_tolerance_mins} Menit</span>
              </div>
              <div className="shift-detail-item">
                <span className="detail-label">Toleransi Datang Lebih Awal:</span>
                <span className="detail-value">{defaultShift?.early_tolerance_mins} Menit</span>
              </div>

              <div className="shift-card-notice">
                <AlertCircle size={16} />
                <span>
                  Gunakan kartu QR fisik Anda pada tablet Kiosk di pintu masuk untuk melakukan presensi.
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

      {/* QR Card Modal Framed as Illustrated Polaroid Card */}
      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="modal-card qr-card-modal" onClick={(e) => e.stopPropagation()}>
            <img
              src="/assets/scrapbook/clip_binder_blue.png"
              alt="Blue Clip"
              className="modal-corner-clip-img"
            />
            <div className="qr-badge-preview">
              <div className="qr-badge-header">
                <span className="badge-org-name">{attendanceService.getOrganization().display_name}</span>
                <span className="badge-chip">ID CARD</span>
              </div>

              <div className="qr-code-canvas-box">
                {currentMember.active_token && (
                  <QRCodeSVG
                    value={currentMember.active_token}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>

              <div className="badge-member-info">
                <h3 className="badge-member-name">{currentMember.full_name}</h3>
                <span className="badge-member-no">{currentMember.member_number}</span>
                <span className="badge-member-dept">{currentMember.department}</span>
              </div>

              <div className="badge-footer-note">
                <img
                  src="/assets/scrapbook/icon_sparkle.png"
                  alt="*"
                  style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }}
                />
                Tunjukkan QR ini ke kamera depan tablet saat datang dan pulang.
              </div>
            </div>

            <button className="btn-modal-close" onClick={() => setShowQRModal(false)}>
              Tutup Kartu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
