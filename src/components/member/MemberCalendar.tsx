import React, { useState } from 'react';
import { CalendarHeart, ChevronLeft, ChevronRight, Clock, Lock, MapPin, Moon, X } from 'lucide-react';
import { DAY_NAMES, facilityService, toDateStr } from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import { describeSchedule } from '../common/SchedulePill';

interface Props {
  memberId: string;
}

export const MemberCalendar: React.FC<Props> = ({ memberId }) => {
  useFacility();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const N = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const shifts = attendanceService.getShifts();
  const published = facilityService.isPublished(year, month);
  const quota = facilityService.getOffRequestQuota(memberId, year, month);
  const rules = facilityService.getRules();
  const mk = `${year}-${String(month).padStart(2, '0')}`;
  const myRequests = facilityService.getOffRequests({ memberId, month: mk }).filter((r) => r.status !== 'CANCELLED');
  const todayStr = toDateStr(today);
  const monthLabel = cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const minMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const move = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    if (next < minMonth || next > maxMonth) return;
    setCursor(next);
    setSelected(null);
  };

  const dateOf = (d: number) => `${mk}-${String(d).padStart(2, '0')}`;
  const scheduleOf = (date: string) => (published ? attendanceService.getMemberSchedule(memberId, date) : undefined);

  // monthly summary from the published schedule
  const monthCells = published ? Array.from({ length: N }, (_, i) => scheduleOf(dateOf(i + 1))) : [];
  const workDays = monthCells.filter((c) => c && (c.schedule_type === 'SHIFT' || c.schedule_type === 'AKE')).length;
  const offDays = monthCells.filter((c) => c && ['OFF', 'REQ_OFF', 'HOLIDAY'].includes(c.schedule_type)).length;
  const nights = monthCells.filter((c) => c?.schedule_type === 'SHIFT' && c.shift_id === rules.night_shift_id).length;

  const deadlineLabel = quota.deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

  const selSchedule = selected ? scheduleOf(selected) : undefined;
  const selRequest = selected ? myRequests.find((r) => r.date === selected) : undefined;
  const selDesc = describeSchedule(selSchedule, shifts);
  const selFloor = facilityService.getFloors().find((f) => f.id === selSchedule?.floor_id);
  const selTasks =
    selected && selSchedule?.schedule_type === 'SHIFT'
      ? facilityService
          .getTasks()
          .filter((t) => t.shift_ids.includes(selSchedule.shift_id || '') && t.days_of_week.includes(new Date(`${selected}T00:00:00`).getDay()))
          .filter((t) => !selFloor || facilityService.getFloorOfRoom(t.room_id)?.id === selFloor.id)
      : [];

  const submit = () => {
    if (!selected) return;
    const res = facilityService.submitOffRequest(memberId, selected, reason);
    setFlash(res);
    if (res.ok) {
      setReason('');
      setSelected(null);
    }
  };

  return (
    <div className="mb-section">
      <div className="mb-cal-head">
        <button type="button" className="btn-cal-nav" onClick={() => move(-1)} aria-label="Bulan sebelumnya">
          <ChevronLeft size={18} />
        </button>
        <div className="mb-cal-title">
          <b>{monthLabel}</b>
          <span className={`status-pill status-pill--${published ? 'present' : 'off'}`}>{published ? 'Jadwal terbit' : 'Belum terbit'}</span>
        </div>
        <button type="button" className="btn-cal-nav" onClick={() => move(1)} aria-label="Bulan berikutnya">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-summary">
        <div>
          <span className="mb-sum-num">{published ? workDays : '–'}</span>
          <span>Hari kerja</span>
        </div>
        <div>
          <span className="mb-sum-num">{published ? offDays : '–'}</span>
          <span>Libur</span>
        </div>
        <div>
          <span className="mb-sum-num">{published ? nights : '–'}</span>
          <span>
            <Moon size={11} /> Malam
          </span>
        </div>
        <div className={quota.remaining === 0 ? 'mb-sum-warn' : ''}>
          <span className="mb-sum-num">
            {quota.used}/{quota.max}
          </span>
          <span>希望休</span>
        </div>
      </div>

      <p className="mb-hint">
        {quota.isClosed ? (
          <>
            <Lock size={13} /> Pengajuan libur bulan ini ditutup{published ? ' (jadwal sudah terbit)' : ` sejak ${deadlineLabel}`}.
          </>
        ) : (
          <>
            <CalendarHeart size={13} /> Ketuk tanggal untuk mengajukan libur yang diinginkan. Sisa {quota.remaining}x, batas {deadlineLabel}. Maks{' '}
            {rules.request_off_max_per_day} staf per tanggal.
          </>
        )}
      </p>

      {flash && (
        <div className={`kg-flash ${flash.ok ? '' : 'kg-flash-error'}`} onClick={() => setFlash(null)}>
          {flash.message}
        </div>
      )}

      <div className="mb-cal-grid" role="grid">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`mb-cal-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
            {d}
          </div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad${i}`} className="mb-cal-pad" />
        ))}
        {Array.from({ length: N }, (_, i) => i + 1).map((d) => {
          const date = dateOf(d);
          const sch = scheduleOf(date);
          const desc = describeSchedule(sch, shifts);
          const req = myRequests.find((r) => r.date === date);
          const dow = new Date(year, month - 1, d).getDay();
          const full = !req && facilityService.countOffRequestsOnDate(date) >= rules.request_off_max_per_day;
          return (
            <button
              type="button"
              key={d}
              className={`mb-cal-day ${date === todayStr ? 'today' : ''} ${date < todayStr ? 'past' : ''} ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''} ${
                selected === date ? 'selected' : ''
              }`}
              onClick={() => {
                setSelected(date);
                setFlash(null);
              }}
            >
              <span className="mb-day-num">{d}</span>
              {sch ? (
                <span className={`mb-day-pill ${desc.className}`} style={desc.color ? { backgroundColor: desc.color } : undefined}>
                  {desc.code}
                </span>
              ) : (
                <span className="mb-day-pill empty-pill">&nbsp;</span>
              )}
              {req && sch?.schedule_type !== 'REQ_OFF' && (
                <span className={`mb-req-dot ${req.status.toLowerCase()}`} title={`希望休: ${req.status}`}>
                  希
                </span>
              )}
              {full && !quota.isClosed && <span className="mb-full-dot" title="Kuota tanggal ini penuh" />}
            </button>
          );
        })}
      </div>

      <div className="mb-legend">
        {shifts.map((s) => (
          <span key={s.id}>
            <i style={{ backgroundColor: s.color_code }}>{s.code}</i> {s.name} {s.start_time}–{s.end_time}
          </span>
        ))}
        <span>
          <i className="ake-pill">明</i> Selesai malam
        </span>
        <span>
          <i className="off-pill">公</i> Libur
        </span>
        <span>
          <i className="req-pill">希</i> Libur diinginkan
        </span>
        <span>
          <i className="leave-pill">有</i> Cuti
        </span>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card mb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{new Date(`${selected}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
              <button type="button" className="btn-close" onClick={() => setSelected(null)} aria-label="Tutup">
                &times;
              </button>
            </div>

            {selSchedule ? (
              <div className="mb-day-detail">
                <span className={`mb-day-pill big ${selDesc.className}`} style={selDesc.color ? { backgroundColor: selDesc.color } : undefined}>
                  {selDesc.code}
                </span>
                <div>
                  <b>{selDesc.label}</b>
                  {selFloor && (
                    <span className="kg-muted">
                      <MapPin size={12} /> {selFloor.name}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="kg-muted">{published ? 'Tidak ada jadwal di tanggal ini.' : 'Jadwal bulan ini belum dipublikasikan admin.'}</p>
            )}

            {selTasks.length > 0 && (
              <div className="mb-task-box">
                <span className="kg-label">Tugas di shift ini</span>
                <ul>
                  {selTasks.map((t) => {
                    const room = facilityService.getRooms().find((r) => r.id === t.room_id);
                    return (
                      <li key={t.id}>
                        <Clock size={12} /> {t.start_time}–{t.end_time} · {t.name} <span className="kg-muted">({room?.name})</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mb-request-box">
              <span className="kg-label">Libur yang diinginkan (希望休)</span>
              {selRequest ? (
                <div className="mb-req-status">
                  <span className={`mb-req-dot ${selRequest.status.toLowerCase()}`}>希</span>
                  <span>
                    {selRequest.status === 'PENDING' && 'Menunggu persetujuan admin'}
                    {selRequest.status === 'APPROVED' && 'Disetujui'}
                    {selRequest.status === 'REJECTED' && `Ditolak${selRequest.admin_note ? `: ${selRequest.admin_note}` : ''}`}
                  </span>
                  {selRequest.status === 'PENDING' && (
                    <button type="button" className="btn-action-sm kg-danger" onClick={() => facilityService.cancelOffRequest(selRequest.id, memberId)}>
                      <X size={13} /> Batalkan
                    </button>
                  )}
                </div>
              ) : quota.isClosed || selected <= todayStr ? (
                <p className="kg-muted">
                  <Lock size={12} /> Tidak bisa diajukan untuk tanggal ini.
                </p>
              ) : (
                <>
                  <p className="kg-muted">
                    Sisa kuota {quota.remaining} dari {quota.max}. Sudah ada {facilityService.countOffRequestsOnDate(selected)} /{' '}
                    {rules.request_off_max_per_day} staf yang mengajukan tanggal ini.
                  </p>
                  <div className="form-group">
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan (opsional), misal: acara keluarga" />
                  </div>
                  <button type="button" className="btn-primary mb-full-btn" onClick={submit} disabled={quota.remaining === 0}>
                    <CalendarHeart size={16} /> Ajukan libur tanggal ini
                  </button>
                </>
              )}
              {flash && !flash.ok && <div className="kg-flash kg-flash-error">{flash.message}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
