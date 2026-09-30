import React from 'react';
import { Scan, Shield, Unlock, Building2 } from 'lucide-react';

export type AppMode = 'kiosk' | 'admin';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  orgName: string;
  isAdminUnlocked: boolean;
  onLockAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  orgName,
  isAdminUnlocked
}) => {
  return (
    <header className="app-header">
      {/* Brand & Branch Info with Koji Mascot Tile */}
      <div className="header-brand-container">
        <div className="header-brand" onClick={() => onSelectMode('kiosk')} style={{ cursor: 'pointer' }}>
          <div className="tactile-tile-btn brand-koji-tile" title="Absence System with Koji">
            <img
              src="/koji_mascot.png"
              alt="Koji Mascot"
              className="navbar-koji-img"
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
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
          <Scan size={16} strokeWidth={2} />
          <span>Kiosk</span>
        </button>

        <button
          className={`mode-nav-btn ${currentMode === 'admin' ? 'active' : ''}`}
          onClick={() => onSelectMode('admin')}
          title="Panel Administrator"
        >
          {isAdminUnlocked ? (
            <Unlock size={16} strokeWidth={2} color="var(--success)" />
          ) : (
            <Shield size={16} strokeWidth={2} />
          )}
          <span>Admin</span>
          {!isAdminUnlocked && <span className="nav-lock-mini-badge">Kunci</span>}
        </button>
      </nav>
    </header>
  );
};

