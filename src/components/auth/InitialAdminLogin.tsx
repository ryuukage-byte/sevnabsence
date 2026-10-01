import React, { useState } from 'react';
import { Tablet, Lock, Mail, ArrowRight, UserCheck, UserPlus, LogIn } from 'lucide-react';
import { authService } from '../../services/authService';
import { attendanceService } from '../../services/attendanceService';

interface InitialAdminLoginProps {
  onSuccess: () => void;
}

export const InitialAdminLogin: React.FC<InitialAdminLoginProps> = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState(import.meta.env.DEV ? 'admin@abccare.com' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'admin123' : '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const org = attendanceService.getOrganization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      const res = authService.registerAdmin(identifier, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message);
      }
    } else {
      const res = authService.signInAdmin(identifier, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="auth-fullscreen-container">
      <div className="auth-card">
        {/* Brand & Setup Header */}
        <div className="auth-header">
          <div className="auth-badge-icon">
            <Tablet size={26} strokeWidth={2} />
          </div>
          <h1 className="auth-title">
            {authMode === 'signin' ? 'Sign In Administrator' : 'Daftar Administrator'}
          </h1>
          <p className="auth-subtitle">
            {authMode === 'signin'
              ? `Masuk ke akun Administrator untuk mengaktifkan Kiosk cabang ${org.display_name}.`
              : `Daftarkan akun Administrator baru untuk mengelola Kiosk presensi cabang ${org.display_name}.`}
          </p>
        </div>

        {/* Segmented Mode Switcher: Sign In vs Daftar */}
        <div className="auth-mode-switch">
          <button
            type="button"
            className={`auth-mode-tab ${authMode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('signin');
              setError(null);
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-mode-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
          >
            <UserPlus size={15} />
            <span>Daftar Akun</span>
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <Mail size={16} /> Email atau Username Admin
            </label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Contoh: admin atau admin@abccare.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={16} /> Kata Sandi Admin
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label>
                <UserCheck size={16} /> Ulangi Kata Sandi
              </label>
              <input
                type="password"
                required
                placeholder="Ketik ulang kata sandi..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn-auth-submit">
            <span>{authMode === 'signin' ? 'Sign In' : 'Daftar & Aktifkan Kiosk'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Clean Link Switcher (Replaces the old explanation note) */}
        <div className="auth-switch-text">
          {authMode === 'signin' ? (
            <>
              Belum punya akun admin?
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
              >
                Daftar Akun
              </button>
            </>
          ) : (
            <>
              Sudah punya akun admin?
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
