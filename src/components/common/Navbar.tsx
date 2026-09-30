import React from 'react';
import { QrCode, User, ShieldCheck, Building2, Lock, Unlock } from 'lucide-react';

export type AppMode = 'kiosk' | 'member' | 'admin';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  orgName: string;
  isAdminUnlocked: boolean;
  onLockAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  orgName,
  isAdminUnlocked,
  onLockAdmin
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo-icon">
          <QrCode size={22} color="#4F46E5" />
        </div>
        <div className="brand-text">
          <span className="brand-title">Absence</span>
          <span className="brand-subtitle">
            <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
            {orgName}
          </span>
        </div>
      </div>

      <nav className="mode-nav">
        <button
          className={`mode-nav-btn ${currentMode === 'kiosk' ? 'active' : ''}`}
          onClick={() => onSelectMode('kiosk')}
        >
          <QrCode size={18} />
          <span>Kiosk Presensi</span>
        </button>

        <button
          className={`mode-nav-btn ${currentMode === 'member' ? 'active' : ''}`}
          onClick={() => onSelectMode('member')}
        >
          <User size={18} />
          <span>Portal Karyawan</span>
        </button>

        <button
          className={`mode-nav-btn ${currentMode === 'admin' ? 'active' : ''}`}
          onClick={() => onSelectMode('admin')}
        >
          {isAdminUnlocked ? <Unlock size={18} color="#10B981" /> : <Lock size={18} />}
          <span>Admin</span>
          {!isAdminUnlocked && <span className="nav-lock-badge">Terkunci</span>}
        </button>

        {isAdminUnlocked && (
          <button
            className="btn-lock-session"
            onClick={onLockAdmin}
            title="Kunci sesi admin dan amankan tablet kembali ke Kiosk"
          >
            <Lock size={14} />
            <span>Kunci Admin</span>
          </button>
        )}
      </nav>
    </header>
  );
};
