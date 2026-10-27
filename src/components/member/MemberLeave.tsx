import React, { useState } from 'react';
import { Plane, Send, X } from 'lucide-react';
import { LEAVE_LABELS, facilityService } from '../../services/facilityService';
import { useFacility } from '../../hooks/useFacility';
import type { LeaveType, RequestStatus } from '../../types/facility';

const STATUS_LABEL: Record<RequestStatus, [string, string]> = {
  PENDING: ['Menunggu', 'late'],
  APPROVED: ['Disetujui', 'present'],
  REJECTED: ['Ditolak', 'absent'],
  CANCELLED: ['Dibatalkan', 'off']
};

export const MemberLeave: React.FC<{ memberId: string }> = ({ memberId }) => {
  useFacility();
  const profile = facilityService.getStaffProfile(memberId);
  const pendingPaid = facilityService.pendingPaidLeaveDays(memberId);
  const history = facilityService.getLeaveRequests({ memberId });
  const [type, setType] = useState<LeaveType>('PAID');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null);

  const days = start && end && end >= start ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1 : 0;

  const submit = () => {
    const res = facilityService.submitLeaveRequest(memberId, type, start, end, reason);
    setFlash(res);
    if (res.ok) {
      setStart('');
      setEnd('');
      setReason('');
    }
  };

  return (
    <div className="mb-section">
      <div className="mb-leave-balance">
        <div>
          <span className="mb-sum-num">{profile.paid_leave_balance}</span>
          <span>Sisa cuti berbayar (有給)</span>
        </div>
        <div>
          <span className="mb-sum-num">{pendingPaid}</span>
          <span>Sedang diajukan</span>
        </div>
        <div>
          <span className="mb-sum-num">{Math.max(0, profile.paid_leave_balance - pendingPaid)}</span>
          <span>Bisa diajukan</span>
        </div>
      </div>

      <section className="kg-card">
        <h3 className="kg-section-title">
          <Plane size={18} /> Ajukan cuti
        </h3>
        <div className="form-group">
          <label>Jenis cuti</label>
          <select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
            {Object.entries(LEAVE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Mulai</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Selesai</label>
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {days > 0 && <p className="kg-muted">Total {days} hari.</p>}
        <div className="form-group">
          <label>Alasan</label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="misal: pulang kampung ke Indonesia" />
        </div>
        {flash && <div className={`kg-flash ${flash.ok ? '' : 'kg-flash-error'}`}>{flash.message}</div>}
        <button type="button" className="btn-primary mb-full-btn" onClick={submit}>
          <Send size={16} /> Kirim pengajuan
        </button>
      </section>

      <section className="kg-card">
        <h3 className="kg-section-title">Riwayat pengajuan</h3>
        {history.length === 0 && <p className="kg-muted">Belum ada pengajuan cuti.</p>}
        <ul className="mb-history">
          {history.map((r) => (
            <li key={r.id}>
              <div>
                <b>{LEAVE_LABELS[r.leave_type]}</b>
                <span className="kg-muted">
                  {r.start_date} – {r.end_date} · {r.days} hari
                </span>
                <span className="kg-muted">{r.reason}</span>
                {r.admin_note && <span className="kg-muted">Catatan admin: {r.admin_note}</span>}
              </div>
              <div className="mb-history-right">
                <span className={`status-pill status-pill--${STATUS_LABEL[r.status][1]}`}>{STATUS_LABEL[r.status][0]}</span>
                {r.status === 'PENDING' && (
                  <button type="button" className="btn-action-sm kg-danger" onClick={() => facilityService.cancelLeaveRequest(r.id, memberId)}>
                    <X size={13} /> Batal
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
