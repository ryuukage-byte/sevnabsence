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
      <div className="modal-card admin-gate-card" onClick={(e) => e.stopPropagation()}>
        <div className="gate-header">
          <div className="tactile-tile-btn" style={{ width: 48, height: 48 }}>
            <Lock size={22} strokeWidth={2} />
          </div>
          <button className="btn-close" onClick={onCancel} title="Batal & Kembali" aria-label="Batal dan kembali">
            <X size={18} />
          </button>
        </div>

        <h2 className="gate-title" style={{ marginTop: 8 }}>Kunci Keamanan Admin</h2>
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

        {import.meta.env.DEV && (
          <div className="gate-quick-helper">
            <span className="helper-hint">[DEV ONLY] Password Demo: <code>admin123</code></span>
            <button type="button" className="btn-quick-fill" onClick={handleAutofillDemo}>
              <CheckCircle2 size={14} /> Isi Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
