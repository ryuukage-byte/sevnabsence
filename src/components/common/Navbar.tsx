import React from 'react';
import { QrCode, User, Building2, Lock, Unlock } from 'lucide-react';

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
      {/* Brand & Branch Stamp */}
      <div className="header-brand">
        <div className="brand-logo-icon">
          <QrCode size={22} color="#244E52" />
        </div>
        <div className="brand-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="brand-title">Absence</span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: '#FFD88A',
                color: '#6D4E1F',
                border: '1px solid #FFE099',
                fontFamily: 'var(--font-display)'
              }}
            >
              DOSSIER
            </span>
          </div>
          <span className="brand-subtitle">
            <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
            {orgName}
          </span>
        </div>
      </div>

      {/* Notebook Index Tabs */}
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
          {isAdminUnlocked ? <Unlock size={18} color="#244E52" /> : <Lock size={18} />}
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
