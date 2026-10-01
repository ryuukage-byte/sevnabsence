import React, { useState, useEffect } from 'react';
import { Building2, Save, Globe, Database, CheckCircle2, ShieldCheck, ChevronDown } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { testSupabaseConnection } from '../../services/supabase';

export const SettingsView: React.FC = () => {
  const [org, setOrg] = useState(attendanceService.getOrganization());
  const [isSaved, setIsSaved] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>('Memeriksa status layanan backend...');

  useEffect(() => {
    let isMounted = true;

    // Timeout safety (3 seconds max)
    const timeoutPromise = new Promise<{ connected: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          connected: false,
          message: 'Penyimpanan Lokal Aktif (Data tersinkronisasi di cache perangkat offline)'
        });
      }, 3000);
    });

    Promise.race([testSupabaseConnection(), timeoutPromise])
      .then((res) => {
        if (isMounted) setDbStatus(res.message);
      })
      .catch(() => {
        if (isMounted) {
          setDbStatus('Penyimpanan Lokal Aktif (Fallback Offline Operasional)');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    attendanceService.updateOrganization(org);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isProd = import.meta.env.PROD;

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
              <span className="live-dot" />
              <span className="status-label">Backend Engine:</span>
              <code className="status-ref">
                {isProd ? 'Supabase Managed Cloud (Production Node)' : 'Supabase (Project Ref: tgnq...qurb)'}
              </code>
            </div>

            <div className="status-desc-text">
              <ShieldCheck size={16} style={{ color: 'var(--accent-sage)', flexShrink: 0 }} />
              <span>{dbStatus}</span>
            </div>

            {/* Advanced Developer Settings in Collapsible Details */}
            <details className="settings-advanced-details">
              <summary className="advanced-summary-header">
                <span>Pengaturan Teknis & SQL Migration (Developer)</span>
                <ChevronDown size={14} />
              </summary>
              <div className="advanced-summary-body">
                <p>
                  Skrip migrasi database lengkap tersedia pada repositori di path{' '}
                  <code>supabase/migrations/20260930_init_absence.sql</code>.
                </p>
                <p style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Stored procedure <code>record_attendance_scan()</code> memvalidasi token kriptografis, zona waktu branch, dan status shift secara atomik di sisi server.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
