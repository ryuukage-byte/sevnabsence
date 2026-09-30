import React from 'react';
import { Scan, User, Shield, Lock, Unlock, Building2 } from 'lucide-react';

export type AppMode = 'kiosk' | 'admin';

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
      {/* Brand & Branch Info with Tactile Tile */}
      <div className="header-brand-container">
        <div className="header-brand">
          <div className="tactile-tile-btn" title="Absence System">
            <Scan size={20} strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Absence</span>
            <span className="brand-subtitle">
              <Building2 size={12} strokeWidth={2} />
              {orgName}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Skeuomorphic Segmented Control */}
      <nav className="mode-nav-segmented">
        <button
          className={`mode-nav-btn ${currentMode === 'kiosk' ? 'active' : ''}`}
          onClick={() => onSelectMode('kiosk')}
          title="Mode Kiosk Presensi Kamera"
        >
          <Scan size={17} strokeWidth={2} />
          <span>Kiosk Presensi</span>
        </button>

        <button
          className={`mode-nav-btn ${currentMode === 'admin' ? 'active' : ''}`}
          onClick={() => onSelectMode('admin')}
          title="Panel Administrator (Perlu Sandi)"
        >
          {isAdminUnlocked ? (
            <Unlock size={17} strokeWidth={2} color="#3B7A57" />
          ) : (
            <Shield size={17} strokeWidth={2} />
          )}
          <span>Admin</span>
          {!isAdminUnlocked && <span className="nav-lock-mini-badge">Kunci</span>}
        </button>

        {isAdminUnlocked && (
          <button
            className="btn-lock-session"
            onClick={onLockAdmin}
            title="Kunci sesi admin dan kembali ke Kiosk"
          >
            <Lock size={13} strokeWidth={2.2} />
            <span>Kunci</span>
          </button>
        )}
      </nav>
    </header>
  );
};
