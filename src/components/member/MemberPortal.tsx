import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, CalendarDays, Clock, Inbox, KeyRound, LogOut, MapPin, Moon, Plane, User } from 'lucide-react';
import {
  EMPLOYMENT_LABELS,
  LEVEL_LABELS,
  QUALIFICATION_LABELS,
  facilityService,
  toDateStr
} from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import { describeSchedule } from '../common/SchedulePill';
import { MessageCenter } from '../common/MessageCenter';
import { MemberCalendar } from './MemberCalendar';
import { MemberLeave } from './MemberLeave';

type Tab = 'profile' | 'calendar' | 'leave' | 'inbox';

const MemberLogin: React.FC<{ onLogin: (id: string) => void }> = ({ onLogin }) => {
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasMembers = attendanceService.getMembers().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = facilityService.memberLogin(number, pin);
    if (res.ok && res.memberId) onLogin(res.memberId);
    else setError(res.message);
  };

  return (
    <div className="mb-login-wrap">
      <form className="auth-card mb-login" onSubmit={submit}>
        <div className="auth-header">
          <div className="auth-badge-icon">
            <User size={26} />
          </div>
          <h2 className="auth-title">Portal Staf</h2>
          <p className="auth-subtitle">{facilityService.getProfile().facility_name}</p>
        </div>
        {error && <div className="auth-error-banner">{error}</div>}
        <div className="form-group">
          <label>Nomor pegawai</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="2026001" autoComplete="username" />
        </div>
        <div className="form-group">
          <label>
            <KeyRound size={13} /> PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary btn-auth-submit">
          Masuk
        </button>
        <p className="auth-footer-note">
          {hasMembers
            ? 'PIN awal = 4 digit terakhir nomor pegawai. Lupa PIN? Hubungi admin.'
            : 'Belum ada data staf. Admin perlu menambahkan staf terlebih dahulu.'}
        </p>
      </form>
    </div>
  );
};

export const MemberPortal: React.FC = () => {
  useFacility();
  const [memberId, setMemberId] = useState<string | null>(facilityService.getMemberSession());
  const [tab, setTab] = useState<Tab>('profile');

  if (!memberId) return <MemberLogin onLogin={setMemberId} />;
  const member = attendanceService.getMembers().find((m) => m.id === memberId);
  if (!member) {
    facilityService.memberLogout();
    return <MemberLogin onLogin={setMemberId} />;
  }

  const profile = facilityService.getStaffProfile(member.id);
  const shifts = attendanceService.getShifts();
  const skills = facilityService.getSkills();
  const floor = facilityService.getFloors().find((f) => f.id === profile.home_floor_id);
  const unread = facilityService.unreadCount(member.id);
  const pendingOff = facilityService.getOffRequests({ memberId: member.id, status: 'PENDING' }).length;

  const now = new Date();
  const todayStr = toDateStr(now);
  const isPub = (d: string) => facilityService.isPublished(Number(d.slice(0, 4)), Number(d.slice(5, 7)));
  const upcoming = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const ds = toDateStr(d);
    return { ds, d, sch: isPub(ds) ? attendanceService.getMemberSchedule(member.id, ds) : undefined };
  });
  const todaySch = upcoming[0].sch;
  const todayDesc = describeSchedule(todaySch, shifts);
  const monthPrefix = todayStr.slice(0, 7);
  const myRecords = attendanceService.getAttendanceRecords().filter((r) => r.member_id === member.id && r.attendance_date.startsWith(monthPrefix));

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'profile', label: 'Profil', icon: <User size={18} /> },
    { id: 'calendar', label: 'Shift', icon: <CalendarDays size={18} />, badge: pendingOff },
    { id: 'leave', label: 'Cuti', icon: <Plane size={18} /> },
    { id: 'inbox', label: 'Pesan', icon: <Inbox size={18} />, badge: unread }
  ];

  return (
    <div className="mb-portal">
      <header className="mb-header">
        <div className="kg-avatar mb-avatar">{member.full_name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
        <div className="mb-header-text">
          <b>{member.full_name}</b>
          <span>
            {member.position} · {floor?.name || member.department}
          </span>
        </div>
        <button
          type="button"
          className="btn-action-sm"
          onClick={() => {
            facilityService.memberLogout();
            setMemberId(null);
          }}
        >
          <LogOut size={14} /> Keluar
        </button>
      </header>

      <nav className="mb-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`mb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}
            <span>{t.label}</span>
            {!!t.badge && <span className="kg-count">{t.badge}</span>}
          </button>
        ))}
      </nav>

      <main className="mb-main">
        {tab === 'profile' && (
          <div className="mb-section">
            <section className="mb-today">
              <span className="kg-label">Hari ini</span>
              {todaySch ? (
                <div className="mb-day-detail">
                  <span className={`mb-day-pill big ${todayDesc.className}`} style={todayDesc.color ? { backgroundColor: todayDesc.color } : undefined}>
                    {todayDesc.code}
                  </span>
                  <div>
                    <b>{todayDesc.label}</b>
                    {todaySch.floor_id && (
                      <span className="kg-muted">
                        <MapPin size={12} /> {facilityService.getFloors().find((f) => f.id === todaySch.floor_id)?.name}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="kg-muted">Belum ada jadwal terbit untuk hari ini.</p>
              )}
              <div className="mb-week">
                {upcoming.map(({ ds, d, sch }) => {
                  const desc = describeSchedule(sch, shifts);
                  return (
                    <div key={ds} className={`mb-week-day ${ds === todayStr ? 'today' : ''}`}>
                      <span>{d.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                      <b>{d.getDate()}</b>
                      <span className={`mb-day-pill ${sch ? desc.className : 'empty-pill'}`} style={desc.color ? { backgroundColor: desc.color } : undefined}>
                        {sch ? desc.code : '·'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="kg-card">
              <h3 className="kg-section-title">
                <BadgeCheck size={18} /> Identitas kerja
              </h3>
              <dl className="kg-dl">
                <dt>Nomor pegawai</dt>
                <dd className="font-mono">{member.member_number}</dd>
                <dt>Level</dt>
                <dd>
                  <span className={`kg-level kg-level-${profile.level}`}>{LEVEL_LABELS[profile.level]}</span>
                </dd>
                <dt>Kualifikasi</dt>
                <dd>{QUALIFICATION_LABELS[profile.qualification]}</dd>
                <dt>Status kerja</dt>
                <dd>{EMPLOYMENT_LABELS[profile.employment_type]}</dd>
                <dt>Shift yang bisa</dt>
                <dd className="kg-chip-row">
                  {shifts
                    .filter((s) => profile.allowed_shift_ids?.includes(s.id))
                    .map((s) => (
                      <span key={s.id} className="kg-shift-chip" style={{ backgroundColor: s.color_code }} title={s.name}>
                        {s.code}
                      </span>
                    ))}
                  {profile.max_night_per_month > 0 && (
                    <span className="kg-muted">
                      <Moon size={12} /> maks {profile.max_night_per_month}x/bulan
                    </span>
                  )}
                </dd>
                <dt>Skill</dt>
                <dd className="kg-chip-row">
                  {profile.skill_ids?.map((id) => (
                    <span key={id} className="kg-chip">
                      {skills.find((s) => s.id === id)?.name}
                    </span>
                  ))}
                </dd>
                <dt>Cuti berbayar</dt>
                <dd>{profile.paid_leave_balance} hari</dd>
              </dl>
            </section>

            <section className="kg-card mb-qr-card">
              <div>
                <h3 className="kg-section-title">
                  <Clock size={18} /> QR presensi
                </h3>
                <p className="kg-muted">Tunjukkan ke kamera kiosk saat Masuk / Pulang.</p>
                <p className="kg-muted">
                  Bulan ini: {myRecords.length} kali hadir, {myRecords.filter((r) => r.status === 'LATE').length} terlambat.
                </p>
              </div>
              {member.active_token && (
                <div className="mb-qr">
                  <QRCodeSVG value={member.active_token} size={132} />
                </div>
              )}
            </section>
          </div>
        )}
        {tab === 'calendar' && <MemberCalendar memberId={member.id} />}
        {tab === 'leave' && <MemberLeave memberId={member.id} />}
        {tab === 'inbox' && (
          <div className="mb-section">
            <MessageCenter viewer={member.id} />
          </div>
        )}
      </main>
    </div>
  );
};
