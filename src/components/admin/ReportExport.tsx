import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, CheckCircle2, Clock, AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { attendanceService, formatDuration } from '../../services/attendanceService';

export const ReportExport: React.FC = () => {
  const records = attendanceService.getAttendanceRecords();
  const members = attendanceService.getMembers();
  const org = attendanceService.getOrganization();

  // Calculations
  const totalScans = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'CORRECTED').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const totalLateMinutes = records.reduce((acc, r) => acc + (r.late_minutes || 0), 0);

  const completedRecords = records.filter((r) => r.work_duration_minutes && r.work_duration_minutes > 0);
  const avgWorkHours =
    completedRecords.length > 0
      ? (
          completedRecords.reduce((acc, r) => acc + (r.work_duration_minutes || 0), 0) /
          (completedRecords.length * 60)
        ).toFixed(1) + ' jam'
      : '–';

  const disciplineRatio = totalScans > 0 ? `${Math.round((presentCount / totalScans) * 100)}%` : '–';

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadCSV = () => {
    const csvContent = attendanceService.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `laporan_presensi_${(org.branch_name || 'shimada').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="report-export-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Laporan & Ekspor Data Presensi</h2>
          <p className="view-subtitle">
            Ringkasan analitik kehadiran staf cabang {org.display_name} dan unduhan CSV untuk penggajian (payroll).
          </p>
        </div>

        {/* Single Consolidated CSV Download Button */}
        <button
          className={`btn-primary ${downloadSuccess ? 'btn-download-success' : ''}`}
          onClick={handleDownloadCSV}
          title="Unduh file rekap presensi CSV"
        >
          {downloadSuccess ? <Check size={18} /> : <Download size={18} />}
          <span>{downloadSuccess ? 'CSV Berhasil Diunduh' : 'Unduh Laporan CSV'}</span>
        </button>
      </div>

      {/* Summary Analytics Cards with Proper Empty State ('–') */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-box--sage">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Kehadiran Tepat Waktu</span>
            <span className="stat-number" style={{ color: 'var(--accent-sage)' }}>
              {totalScans > 0 ? presentCount : '–'}
            </span>
            <span className="stat-hint">{disciplineRatio} rasio disiplin</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-box--caramel">
            <AlertTriangle size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Insiden Terlambat</span>
            <span className="stat-number" style={{ color: 'var(--accent-caramel)' }}>
              {totalScans > 0 ? lateCount : '–'}
            </span>
            <span className="stat-hint">
              Total akumulasi:{' '}
              {totalLateMinutes > 0 ? formatDuration(totalLateMinutes) : '–'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-box--neutral">
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rata-rata Jam Kerja</span>
            <span className="stat-number" style={{ color: 'var(--text-main)' }}>{avgWorkHours}</span>
            <span className="stat-hint">Per presensi selesai</span>
          </div>
        </div>
      </div>

      {/* CSV Export Details Card (Educational / Format Spec) */}
      <div className="export-spec-card">
        <div className="spec-card-icon">
          <FileSpreadsheet size={36} color="var(--accent-sage)" strokeWidth={2} />
        </div>
        <div className="spec-card-body">
          <h3>Spesifikasi Format Dokumen CSV</h3>
          <p>
            File rekap presensi yang diunduh mencakup kolom terstruktur: <code>Tanggal</code>,{' '}
            <code>Nama Karyawan</code>, <code>Departemen</code>, <code>Shift</code>,{' '}
            <code>Jam Masuk</code>, <code>Jam Pulang</code>, <code>Status</code>,{' '}
            <code>Terlambat (Menit)</code>, <code>Total Kerja (Menit)</code>, dan{' '}
            <code>Status Review</code>.
          </p>
          <div className="spec-meta-list">
            <span>• Kompatibel langsung dengan Microsoft Excel, Google Sheets, dan software HRIS</span>
            <span>• Standard RFC 4180 dengan pemisah koma (comma-separated values)</span>
            <span>• Enkoding UTF-8 universal dengan timestamp berbasis zona {org.timezone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
