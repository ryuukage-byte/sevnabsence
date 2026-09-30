import React, { useState } from 'react';
import { ShieldCheck, Tablet, Sparkles, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { attendanceService } from '../../services/attendanceService';

interface InitialAdminLoginProps {
  onSuccess: () => void;
}

export const InitialAdminLogin: React.FC<InitialAdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@abccare.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const org = attendanceService.getOrganization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = authService.initialAdminLogin(email, password);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.message);
    }
  };

  const handleUseDemo = () => {
    setEmail('admin@abccare.com');
    setPassword('admin123');
  };

  return (
    <div className="auth-fullscreen-container">
      <div className="auth-card">
        {/* Brand & Setup Header */}
        <div className="auth-header">
          <div className="auth-badge-icon">
            <Tablet size={32} color="#4F46E5" />
          </div>
          <span className="auth-tag">
            <Sparkles size={14} /> Aktivasi Perangkat Baru
          </span>
          <h1 className="auth-title">Setup Tablet Kiosk</h1>
          <p className="auth-subtitle">
            Masuk sebagai Administrator untuk menghubungkan perangkat tablet ini ke cabang{' '}
            <strong>{org.display_name}</strong>.
          </p>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <Mail size={16} /> Email Administrator
            </label>
            <input
              type="email"
              required
              placeholder="admin@perusahaan.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Kata Sandi Admin
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-auth-submit">
            <span>Aktifkan Kiosk Presensi</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-demo-helper">
          <div className="helper-label">Kredensial Demo Awal:</div>
          <div className="helper-creds font-mono">
            <span>admin@abccare.com</span> / <span>admin123</span>
          </div>
          <button type="button" className="btn-helper-fill" onClick={handleUseDemo}>
            <CheckCircle2 size={14} /> Isi Otomatis Kredensial Demo
          </button>
        </div>

        <div className="auth-footer-note">
          Setelah login pertama ini, tablet akan langsung masuk ke layar <strong>Kiosk Presensi</strong> untuk karyawan, dan menu Admin akan selalu terkunci password.
        </div>
      </div>
    </div>
  );
};
