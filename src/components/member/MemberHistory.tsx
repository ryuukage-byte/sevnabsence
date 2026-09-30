import React, { useState } from 'react';
import { History, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';
import type { AttendanceRecord } from '../../types/attendance';

interface MemberHistoryProps {
  memberId: string;
  memberName: string;
}

export const MemberHistory: React.FC<MemberHistoryProps> = ({ memberId, memberName }) => {
  const allRecords = attendanceService.getAttendanceRecords();
  const myRecords = allRecords.filter((r) => r.member_id === memberId);

  return (
    <div className="member-history-container">
      <div className="history-header">
        <div>
          <h2>Riwayat Presensi: {memberName}</h2>
          <p className="history-subtitle">
            Daftar lengkap kehadiran dan jam kerja yang tercatat di server.
          </p>
        </div>
        <div className="history-count-badge">
          Total Record: {myRecords.length}
        </div>
      </div>

      {myRecords.length === 0 ? (
        <div className="empty-history-state">
          <Clock size={48} color="#A69B91" />
          <h3>Belum Ada Riwayat Presensi</h3>
          <p>Lakukan presensi scan QR pada tablet Kiosk untuk mulai mencatat kehadiran.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Shift</th>
                <th>Presensi Masuk</th>
                <th>Presensi Pulang</th>
                <th>Status</th>
                <th>Keterlambatan</th>
                <th>Durasi Kerja</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.attendance_date}</td>
                  <td>{r.shift_name || 'Shift A'}</td>
                  <td>
                    {r.check_in_at ? (
                      <span className="font-mono text-emerald-600">
                        {new Date(r.check_in_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {r.check_out_at ? (
                      <span className="font-mono text-rose-600">
                        {new Date(r.check_out_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">Belum Pulang</span>
                    )}
                  </td>
                  <td>
                    <Badge status={r.status} size="sm" />
                  </td>
                  <td>
                    {r.late_minutes > 0 ? (
                      <span className="text-amber-600 font-semibold">
                        +{r.late_minutes} menit
                      </span>
                    ) : (
                      <span className="text-muted">Tepat Waktu</span>
                    )}
                  </td>
                  <td>
                    {r.work_duration_minutes > 0
                      ? `${Math.floor(r.work_duration_minutes / 60)}j ${
                          r.work_duration_minutes % 60
                        }m`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
