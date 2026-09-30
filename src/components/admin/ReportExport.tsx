import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';

export const ReportExport: React.FC = () => {
  const records = attendanceService.getAttendanceRecords();
  const members = attendanceService.getMembers();

  // Basic Calculations
  const totalScans = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'CORRECTED').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const totalLateMinutes = records.reduce((acc, r) => acc + (r.late_minutes || 0), 0);
  const avgWorkHours =
    records.length > 0
      ? (
          records.reduce((acc, r) => acc + (r.work_duration_minutes || 0), 0) /
          (records.length * 60)
        ).toFixed(1)
      : '0.0';

  const handleDownloadCSV = () => {
    const csvContent = attendanceService.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `laporan_presensi_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-export-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Laporan & Ekspor Data Presensi</h2>
          <p className="view-subtitle">
            Ringkasan analitik kehadiran staf dan unduhan file CSV untuk kebutuhan penggajian (payroll).
          </p>
        </div>

        <button className="btn-primary" onClick={handleDownloadCSV}>
          <Download size={18} />
          <span>Unduh Laporan CSV</span>
        </button>
      </div>

      {/* Summary Analytics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#EBF4EE', color: '#3B7A57' }}>
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Kehadiran Tepat Waktu</span>
            <span className="stat-number" style={{ color: '#3B7A57' }}>{presentCount}</span>
            <span className="stat-hint">
              {totalScans > 0 ? Math.round((presentCount / totalScans) * 100) : 100}% rasio disiplin
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#FAF2E4', color: '#C9944A' }}>
            <AlertTriangle size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Insiden Terlambat</span>
            <span className="stat-number" style={{ color: '#C9944A' }}>{lateCount}</span>
            <span className="stat-hint">Total akumulasi: {totalLateMinutes} menit</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#F2ECE4', color: '#8D7B6D' }}>
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rata-rata Jam Kerja</span>
            <span className="stat-number" style={{ color: '#4E423A' }}>{avgWorkHours} jam</span>
            <span className="stat-hint">Per presensi selesai</span>
          </div>
        </div>
      </div>

      {/* CSV Export Details Card */}
      <div className="export-spec-card">
        <div className="spec-card-icon">
          <FileSpreadsheet size={36} color="#3B7A57" strokeWidth={2} />
        </div>
        <div className="spec-card-body">
          <h3>Spesifikasi Format CSV</h3>
          <p>
            File CSV yang dihasilkan mencakup kolom: <code>Tanggal</code>,{' '}
            <code>Nama Karyawan</code>, <code>Departemen</code>, <code>Shift</code>,{' '}
            <code>Jam Masuk</code>, <code>Jam Pulang</code>, <code>Status</code>,{' '}
            <code>Terlambat (Menit)</code>, <code>Total Kerja (Menit)</code>, dan{' '}
            <code>Status Review</code>.
          </p>
          <div className="spec-meta-list">
            <span>• Kompatibel dengan Microsoft Excel, Google Sheets, dan LibreOffice</span>
            <span>• Pemisah data koma (standard RFC 4180)</span>
            <span>• Enkoding UTF-8 universal</span>
          </div>
        </div>
        <div className="spec-card-action">
          <button className="btn-export-csv" onClick={handleDownloadCSV}>
            <Download size={18} />
            <span>Ekspor Sekarang (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
