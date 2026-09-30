import React, { useState } from 'react';
import { Building2, Save, Globe, Database, CheckCircle2 } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { testSupabaseConnection } from '../../services/supabase';

export const SettingsView: React.FC = () => {
  const [org, setOrg] = useState(attendanceService.getOrganization());
  const [isSaved, setIsSaved] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Memeriksa koneksi Supabase...');

  React.useEffect(() => {
    testSupabaseConnection().then((res) => setDbStatus(res.message));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    attendanceService.updateOrganization(org);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="settings-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Pengaturan Organisasi & Sistem</h2>
          <p className="view-subtitle">
            Konfigurasi identitas bisnis, nama cabang, zona waktu, dan status backend Supabase.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Organization Profile Card */}
        <div className="settings-card">
          <div className="card-header-line">
            <Building2 size={20} className="text-indigo-600" />
            <h3>Identitas Perusahaan & Cabang</h3>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>Nama Perusahaan (Company Name) *</label>
              <input
                type="text"
                required
                value={org.company_name}
                onChange={(e) => {
                  const company = e.target.value;
                  const display = org.branch_name ? `${company} - ${org.branch_name}` : company;
                  setOrg({ ...org, company_name: company, display_name: display });
                }}
              />
            </div>

            <div className="form-group">
              <label>Nama Cabang (Branch Name)</label>
              <input
                type="text"
                placeholder="Contoh: Shimada Branch / Cabang Jakarta"
                value={org.branch_name || ''}
                onChange={(e) => {
                  const branch = e.target.value;
                  const display = branch ? `${org.company_name} - ${branch}` : org.company_name;
                  setOrg({ ...org, branch_name: branch, display_name: display });
                }}
              />
            </div>

            <div className="form-group">
              <label>Nama Tampilan di Kiosk Tablet (Display Name) *</label>
              <input
                type="text"
                required
                value={org.display_name}
                onChange={(e) => setOrg({ ...org, display_name: e.target.value })}
              />
              <span className="form-hint">
                Nama ini yang ditampilkan di layar utama tablet saat karyawan melakukan presensi.
              </span>
            </div>

            <div className="form-group">
              <label>Zona Waktu Operasional</label>
              <select
                value={org.timezone}
                onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta - UTC+7)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar - UTC+8)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura - UTC+9)</option>
                <option value="Asia/Tokyo">JST (Asia/Tokyo - UTC+9)</option>
              </select>
            </div>

            <div className="settings-save-row">
              <button type="submit" className="btn-primary">
                <Save size={18} />
                <span>Simpan Pengaturan</span>
              </button>
              {isSaved && (
                <span className="save-confirmed">
                  <CheckCircle2 size={16} /> Pengaturan berhasil disimpan!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Supabase Connection Status Card */}
        <div className="settings-card">
          <div className="card-header-line">
            <Database size={20} className="text-emerald-600" />
            <h3>Status Konektivitas Supabase</h3>
          </div>

          <div className="supabase-status-box">
            <div className="status-indicator-row">
              <span className="live-dot" />
              <span className="status-label">Project Ref:</span>
              <code className="status-ref">tgnqtexegvcpagphqurb</code>
            </div>

            <div className="status-desc-text">
              {dbStatus}
            </div>

            <div className="migration-tip-box">
              <span className="tip-title">Panduan SQL Migration:</span>
              <p>
                File skema database telah disiapkan di{' '}
                <code>supabase/migrations/20260930_init_absence.sql</code>. Anda dapat menyalin
                dan mengeksekusi isi skrip tersebut langsung ke <strong>Supabase Dashboard &gt; SQL Editor</strong>{' '}
                untuk mengaktifkan stored procedure <code>record_attendance_scan()</code> secara penuh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
