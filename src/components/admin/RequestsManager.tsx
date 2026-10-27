import React, { useState } from 'react';
import { CalendarHeart, CalendarX2, Check, Plane, X } from 'lucide-react';
import { LEAVE_LABELS, facilityService } from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import type { RequestStatus } from '../../types/facility';

const STATUS_PILL: Record<RequestStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Menunggu', tone: 'late' },
  APPROVED: { label: 'Disetujui', tone: 'present' },
  REJECTED: { label: 'Ditolak', tone: 'absent' },
  CANCELLED: { label: 'Dibatalkan', tone: 'off' }
};

export const RequestsManager: React.FC = () => {
  useFacility();
  const [tab, setTab] = useState<'off' | 'leave'>('off');
  const [status, setStatus] = useState<RequestStatus | ''>('PENDING');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const members = attendanceService.getMembers();
  const nameOf = (id: string) => members.find((m) => m.id === id)?.full_name || 'Staf';
  const floorOf = (id: string) => {
    const p = facilityService.getStaffProfile(id);
    return facilityService.getFloors().find((f) => f.id === p.home_floor_id)?.name || '';
  };

  const offRequests = facilityService.getOffRequests(status ? { status } : undefined);
  const leaveRequests = facilityService.getLeaveRequests(status ? { status } : undefined);
  const pendingOff = facilityService.getOffRequests({ status: 'PENDING' }).length;
  const pendingLeave = facilityService.getLeaveRequests({ status: 'PENDING' }).length;
  const rules = facilityService.getRules();

  const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const noteInput = (id: string) => (
    <input
      className="kg-note-input"
      placeholder="Catatan (opsional)"
      value={notes[id] || ''}
      onChange={(e) => setNotes({ ...notes, [id]: e.target.value })}
    />
  );

  return (
    <div className="kg-page">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Pengajuan Libur & Cuti</h2>
          <p className="view-subtitle">
            Setujui atau tolak 希望休 dan cuti. Keputusan langsung masuk ke jadwal dan dikirim ke kotak pesan staf. Aturan aktif:
            maks {rules.request_off_max_per_month}x/bulan per staf, maks {rules.request_off_max_per_day} staf per tanggal, batas tgl{' '}
            {rules.request_deadline_day} bulan sebelumnya.
          </p>
        </div>
      </div>

      <div className="kg-tabs">
        <button type="button" className={`kg-tab ${tab === 'off' ? 'active' : ''}`} onClick={() => setTab('off')}>
          <CalendarHeart size={15} /> Libur diinginkan (希望休) {pendingOff > 0 && <span className="kg-count">{pendingOff}</span>}
        </button>
        <button type="button" className={`kg-tab ${tab === 'leave' ? 'active' : ''}`} onClick={() => setTab('leave')}>
          <Plane size={15} /> Cuti {pendingLeave > 0 && <span className="kg-count">{pendingLeave}</span>}
        </button>
        <select className="kg-tab-select" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus | '')} aria-label="Filter status">
          <option value="PENDING">Menunggu</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
          <option value="">Semua</option>
        </select>
      </div>

      <div className="kg-card">
        {tab === 'off' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staf</th>
                  <th>Tanggal</th>
                  <th>Alasan</th>
                  <th>Pengaju di tgl sama</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {offRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-empty-cell">
                      <CalendarX2 size={20} /> Tidak ada pengajuan.
                    </td>
                  </tr>
                )}
                {offRequests.map((r) => {
                  const sameDay = facilityService.countOffRequestsOnDate(r.date);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="name-bold">{nameOf(r.member_id)}</span>
                        <span className="email-sub">{floorOf(r.member_id)}</span>
                      </td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{r.reason || <span className="kg-muted">–</span>}</td>
                      <td>
                        <span className={sameDay >= rules.request_off_max_per_day ? 'kg-warn-text' : ''}>
                          {sameDay} / {rules.request_off_max_per_day}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${STATUS_PILL[r.status].tone}`}>{STATUS_PILL[r.status].label}</span>
                        {r.admin_note && <span className="email-sub">{r.admin_note}</span>}
                      </td>
                      <td>
                        {r.status === 'PENDING' ? (
                          <div className="kg-decide">
                            {noteInput(r.id)}
                            <button type="button" className="btn-action-sm kg-ok" onClick={() => facilityService.decideOffRequest(r.id, true, notes[r.id])}>
                              <Check size={14} /> Setuju
                            </button>
                            <button type="button" className="btn-action-sm kg-danger" onClick={() => facilityService.decideOffRequest(r.id, false, notes[r.id])}>
                              <X size={14} /> Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="kg-muted">–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'leave' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staf</th>
                  <th>Jenis</th>
                  <th>Periode</th>
                  <th>Alasan</th>
                  <th>Sisa cuti</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-empty-cell">
                      Tidak ada pengajuan cuti.
                    </td>
                  </tr>
                )}
                {leaveRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="name-bold">{nameOf(r.member_id)}</span>
                      <span className="email-sub">{floorOf(r.member_id)}</span>
                    </td>
                    <td>{LEAVE_LABELS[r.leave_type]}</td>
                    <td>
                      {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                      <span className="email-sub">{r.days} hari</span>
                    </td>
                    <td>{r.reason}</td>
                    <td>{facilityService.getStaffProfile(r.member_id).paid_leave_balance} hari</td>
                    <td>
                      <span className={`status-pill status-pill--${STATUS_PILL[r.status].tone}`}>{STATUS_PILL[r.status].label}</span>
                      {r.admin_note && <span className="email-sub">{r.admin_note}</span>}
                    </td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <div className="kg-decide">
                          {noteInput(r.id)}
                          <button type="button" className="btn-action-sm kg-ok" onClick={() => facilityService.decideLeaveRequest(r.id, true, notes[r.id])}>
                            <Check size={14} /> Setuju
                          </button>
                          <button type="button" className="btn-action-sm kg-danger" onClick={() => facilityService.decideLeaveRequest(r.id, false, notes[r.id])}>
                            <X size={14} /> Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="kg-muted">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
