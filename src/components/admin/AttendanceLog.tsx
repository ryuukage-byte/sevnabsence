import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';
import type { AttendanceRecord, ReviewStatus } from '../../types/attendance';

export const AttendanceLog: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>(
    attendanceService.getAttendanceRecords()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewFilter, setReviewFilter] = useState('ALL');

  // Correction Modal State
  const [selectedForCorrection, setSelectedForCorrection] = useState<AttendanceRecord | null>(
    null
  );
  const [newCheckInTime, setNewCheckInTime] = useState('');
  const [newCheckOutTime, setNewCheckOutTime] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Anti-proxy Review Modal State
  const [selectedForReview, setSelectedForReview] = useState<AttendanceRecord | null>(null);
  const [reviewReason, setReviewReason] = useState('');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.member_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.attendance_date.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesReview =
      reviewFilter === 'ALL' ||
      (reviewFilter === 'PENDING' && r.review_status !== 'NORMAL');
    return matchesSearch && matchesStatus && matchesReview;
  });

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setSelectedForCorrection(record);
    setNewCheckInTime(
      record.check_in_at
        ? new Date(record.check_in_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '08:00'
    );
    setNewCheckOutTime(
      record.check_out_at
        ? new Date(record.check_out_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '17:00'
    );
    setCorrectionReason('');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForCorrection || !correctionReason) return;

    const baseDate = selectedForCorrection.attendance_date;
    const constructedIn = `${baseDate}T${newCheckInTime}:00`;
    const constructedOut = newCheckOutTime ? `${baseDate}T${newCheckOutTime}:00` : '';

    attendanceService.correctAttendance(
      selectedForCorrection.id,
      constructedIn,
      constructedOut,
      correctionReason
    );

    setRecords([...attendanceService.getAttendanceRecords()]);
    setSelectedForCorrection(null);
  };

  const handleApplyReview = (status: ReviewStatus) => {
    if (!selectedForReview) return;

    attendanceService.reviewAttendance(selectedForReview.id, status, reviewReason);
    setRecords([...attendanceService.getAttendanceRecords()]);
    setSelectedForReview(null);
  };

  return (
    <div className="attendance-log-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Log Presensi & Audit Kehadiran</h2>
          <p className="view-subtitle">
            Pantau riwayat presensi, lakukan koreksi waktu, dan verifikasi anti-joki (proxy scan).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau tanggal (YYYY-MM-DD)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Semua Status</option>
            <option value="PRESENT">Tepat Waktu</option>
            <option value="LATE">Terlambat</option>
            <option value="CORRECTED">Dikoreksi</option>
          </select>

          <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
            <option value="ALL">Semua Review</option>
            <option value="PENDING">Perlu Review / Ditandai</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Karyawan</th>
              <th>Departemen</th>
              <th>Shift</th>
              <th>Presensi Masuk</th>
              <th>Presensi Pulang</th>
              <th>Status</th>
              <th>Anti-Joki Review</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted">
                  Tidak ada data presensi yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td className="font-mono font-semibold">{rec.attendance_date}</td>
                  <td>
                    <span className="font-semibold">{rec.member_name}</span>
                  </td>
                  <td>{rec.department || '-'}</td>
                  <td>{rec.shift_name || 'Shift A'}</td>
                  <td>
                    {rec.check_in_at ? (
                      <span className="font-mono text-emerald-600 font-semibold">
                        {new Date(rec.check_in_at).toLocaleTimeString('id-ID', {
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
                    {rec.check_out_at ? (
                      <span className="font-mono text-rose-600 font-semibold">
                        {new Date(rec.check_out_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Belum Pulang</span>
                    )}
                  </td>
                  <td>
                    <Badge status={rec.status} size="sm" />
                    {rec.late_minutes > 0 && (
                      <span className="late-subtag">+{rec.late_minutes}m</span>
                    )}
                  </td>
                  <td>
                    <Badge status={rec.review_status} size="sm" />
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      <button
                        className="btn-action-sm btn-correct"
                        onClick={() => handleOpenCorrection(rec)}
                        title="Koreksi jam presensi (Audit trail disimpan)"
                      >
                        <Edit3 size={14} /> Koreksi
                      </button>
                      <button
                        className="btn-action-sm btn-review"
                        onClick={() => {
                          setSelectedForReview(rec);
                          setReviewReason(rec.review_reason || '');
                        }}
                        title="Verifikasi keabsahan presensi"
                      >
                        <ShieldCheck size={14} /> Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Correction Dialog */}
      {selectedForCorrection && (
        <div className="modal-backdrop" onClick={() => setSelectedForCorrection(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Koreksi Presensi: {selectedForCorrection.member_name}</h3>
              <button className="btn-close" onClick={() => setSelectedForCorrection(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="modal-form">
              <div className="correction-warning-banner">
                <AlertTriangle size={18} color="#C9944A" />
                <p>
                  Sesuai aturan kepatuhan, jam asli scan tidak akan dihapus. Perubahan akan
                  dicatat ke dalam tabel audit log beserta identitas administrator dan alasan
                  koreksi.
                </p>
              </div>

              <div className="form-group">
                <label>Tanggal Presensi</label>
                <input
                  type="text"
                  disabled
                  value={selectedForCorrection.attendance_date}
                  className="input-disabled font-mono"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jam Masuk Baru</label>
                  <input
                    type="time"
                    required
                    value={newCheckInTime}
                    onChange={(e) => setNewCheckInTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Jam Pulang Baru (Opsional)</label>
                  <input
                    type="time"
                    value={newCheckOutTime}
                    onChange={(e) => setNewCheckOutTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alasan Koreksi (Wajib Diisi untuk Audit) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Karyawan lupa membawa kartu QR fisik karena tugas dinas luar..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedForCorrection(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Perubahan & Catat Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Anti-Proxy Review Modal */}
      {selectedForReview && (
        <div className="modal-backdrop" onClick={() => setSelectedForReview(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verifikasi Anti-Joki Presensi</h3>
              <button className="btn-close" onClick={() => setSelectedForReview(null)}>
                &times;
              </button>
            </div>

            <div className="review-modal-body">
              <div className="review-meta-box">
                <div>
                  <strong>Karyawan:</strong> {selectedForReview.member_name}
                </div>
                <div>
                  <strong>Tanggal:</strong> {selectedForReview.attendance_date}
                </div>
                <div>
                  <strong>Jam Scan Masuk:</strong>{' '}
                  {selectedForReview.check_in_at
                    ? new Date(selectedForReview.check_in_at).toLocaleTimeString()
                    : '-'}
                </div>
              </div>

              <div className="form-group">
                <label>Catatan Hasil Verifikasi:</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Terkonfirmasi staf benar-benar hadir secara fisik di ruangan..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                />
              </div>

              <div className="review-actions-row">
                <button
                  type="button"
                  className="btn-review-valid"
                  onClick={() => handleApplyReview('VERIFIED')}
                >
                  <ShieldCheck size={18} />
                  <span>Tandai Sah (Verified)</span>
                </button>

                <button
                  type="button"
                  className="btn-review-invalid"
                  onClick={() => handleApplyReview('FLAGGED_INVALID')}
                >
                  <ShieldAlert size={18} />
                  <span>Tandai Tidak Sah (Joki / Palsu)</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedForReview(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
