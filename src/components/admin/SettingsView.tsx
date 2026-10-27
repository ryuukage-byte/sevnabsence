import React, { useState } from 'react';
import { Building2, Save, Globe, Database, CheckCircle2, ShieldCheck, ChevronDown } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { SUPABASE_PROJECT_REF } from '../../services/supabase';
import { cloudSync } from '../../services/cloudSync';
import { useCloudSync } from '../../hooks/useFacility';

export const SettingsView: React.FC = () => {
  const [org, setOrg] = useState(attendanceService.getOrganization());
  const [isSaved, setIsSaved] = useState(false);
  const sync = useCloudSync();
  const [retrying, setRetrying] = useState(false);

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
            Konfigurasi identitas cabang {org.display_name}, zona waktu operasional, dan status sinkronisasi.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Organization Profile Card */}
        <div className="settings-card">
          <div className="card-header-line">
            <Building2 size={20} style={{ color: 'var(--accent-sage)' }} />
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
              <label>Zona Waktu Operasional Cabang</label>
              <select
                value={org.timezone}
                onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
              >
                <option value="Asia/Tokyo">JST — Jepang (Asia/Tokyo - UTC+9)</option>
                <option value="Asia/Jakarta">WIB — Indonesia Barat (Asia/Jakarta - UTC+7)</option>
                <option value="Asia/Makassar">WITA — Indonesia Tengah (Asia/Makassar - UTC+8)</option>
                <option value="Asia/Jayapura">WIT — Indonesia Timur (Asia/Jayapura - UTC+9)</option>
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

        {/* Cloud & Operational Infrastructure Card */}
        <div className="settings-card">
          <div className="card-header-line">
            <Database size={20} color="var(--accent-sage)" strokeWidth={2.2} />
            <h3>Status Layanan & Keamanan</h3>
          </div>

          <div className="supabase-status-box">
            <div className="status-indicator-row">
              <span className={`sync-dot sync-dot--${sync.status}`} />
              <span className="status-label">Sinkron cloud:</span>
              <code className="status-ref">
                Supabase {SUPABASE_PROJECT_REF} · org "{sync.orgId}"
              </code>
            </div>

            <div className="status-desc-text">
              <ShieldCheck size={16} style={{ color: 'var(--accent-sage)', flexShrink: 0 }} />
              <span>
                {sync.message}
                {sync.lastSyncAt && ` Terakhir sinkron ${sync.lastSyncAt.toLocaleTimeString('id-ID')}.`}
              </span>
            </div>

            {sync.status !== 'disabled' && sync.status !== 'online' && (
              <button
                type="button"
                className="btn-secondary kg-btn-sm"
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true);
                  await cloudSync.retry();
                  setRetrying(false);
                }}
              >
                {retrying ? 'Menghubungkan…' : 'Coba sambungkan lagi'}
              </button>
            )}

            {/* Advanced Developer Settings in Collapsible Details */}
            <details className="settings-advanced-details">
              <summary className="advanced-summary-header">
                <span>Pengaturan Teknis & SQL Migration (Developer)</span>
                <ChevronDown size={14} />
              </summary>
              <div className="advanced-summary-body">
                <p>
                  Sinkron lintas perangkat memakai tabel <code>app_records</code> dari{' '}
                  <code>supabase/migrations/20261028_app_records_sync.sql</code>. Atur project lewat{' '}
                  <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> dan <code>VITE_ORG_ID</code>.
                </p>
                <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Data disimpan juga di perangkat ini, jadi kiosk tetap bisa scan saat offline dan mengirim perubahan setelah online kembali.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
