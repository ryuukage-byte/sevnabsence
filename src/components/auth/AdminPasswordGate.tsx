import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

interface AdminPasswordGateProps {
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const AdminPasswordGate: React.FC<AdminPasswordGateProps> = ({
  onUnlockSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const isValid = authService.unlockAdmin(password);
    if (isValid) {
      setError(false);
      onUnlockSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleAutofillDemo = () => {
    setPassword('admin123');
    setError(false);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card admin-gate-card" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <img
          src="/assets/scrapbook/clip_binder_blue.png"
          alt="Blue Clip"
          style={{
            position: 'absolute',
            top: -18,
            left: 24,
            width: 42,
            zIndex: 10,
            transform: 'rotate(-10deg)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))',
            pointerEvents: 'none'
          }}
        />
        <img
          src="/assets/scrapbook/washi_hearts_peach.png"
          alt="Peach Washi"
          style={{
            position: 'absolute',
            top: -12,
            right: 24,
            width: 85,
            zIndex: 10,
            transform: 'rotate(4deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
            pointerEvents: 'none'
          }}
        />

        <div className="gate-header">
          <div className="gate-icon-box">
            <img
              src="/assets/scrapbook/icon_gear.png"
              alt="Lock"
              style={{ width: 30, height: 30, objectFit: 'contain' }}
            />
          </div>
          <button className="btn-close" onClick={onCancel} title="Batal & Kembali">
            <X size={20} />
          </button>
        </div>

        <h2 className="gate-title">Kunci Keamanan Admin</h2>
        <p className="gate-desc">
          Layar ini terkunci untuk mencegah perubahan data oleh karyawan. Masukkan kata sandi atau PIN Admin untuk melanjutkan.
        </p>

        {error && (
          <div className="gate-error-banner">
            <AlertCircle size={16} />
            <span>Kata sandi atau PIN salah. Silakan coba lagi.</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="gate-form">
          <div className="form-group">
            <label>Kata Sandi / PIN Admin</label>
            <div className="gate-input-wrapper">
              <KeyRound size={18} className="gate-input-icon" />
              <input
                type="password"
                autoFocus
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
              />
            </div>
          </div>

          <div className="gate-actions-row">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Batal
            </button>
            <button type="submit" className="btn-primary btn-unlock">
              <span>Buka Menu Admin</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        <div className="gate-quick-helper">
          <span className="helper-hint">Password Demo: <code>admin123</code></span>
          <button type="button" className="btn-quick-fill" onClick={handleAutofillDemo}>
            <CheckCircle2 size={14} /> Isi Demo
          </button>
        </div>
      </div>
    </div>
  );
};
