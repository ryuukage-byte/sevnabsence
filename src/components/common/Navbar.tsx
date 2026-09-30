import React from 'react';
import { Lock, Unlock } from 'lucide-react';

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
      {/* Brand & Branch Stamp with Illustrated Cream Leaf Banner */}
      <div className="header-brand-container">
        <div className="header-brand">
          <div className="brand-logo-icon">
            <img
              src="/assets/scrapbook/badge_paw.png"
              alt="Logo"
              className="brand-paw-img"
            />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="brand-title">Absence</span>
              <span className="brand-dossier-pill">DOSSIER</span>
            </div>
            <span className="brand-subtitle">
              <img
                src="/assets/scrapbook/washi_leaves_sage.png"
                alt="leaf"
                style={{ height: 12, marginRight: 4, opacity: 0.8 }}
              />
              {orgName}
            </span>
          </div>
        </div>
      </div>

      {/* Illustrated Scrapbook Folder Index Tabs */}
      <nav className="mode-nav-tabs">
        <button
          className={`scrapbook-tab-btn ${currentMode === 'kiosk' ? 'active' : ''}`}
          onClick={() => onSelectMode('kiosk')}
          title="Buka Kiosk Presensi QR"
        >
          <img
            src="/assets/scrapbook/tab_home.png"
            alt="Kiosk Presensi"
            className="tab-illustrated-img"
          />
          <span className="tab-label">Kiosk</span>
        </button>

        <button
          className={`scrapbook-tab-btn ${currentMode === 'member' ? 'active' : ''}`}
          onClick={() => onSelectMode('member')}
          title="Buka Portal Karyawan"
        >
          <img
            src="/assets/scrapbook/tab_member.png"
            alt="Portal Karyawan"
            className="tab-illustrated-img"
          />
          <span className="tab-label">Karyawan</span>
        </button>

        <button
          className={`scrapbook-tab-btn ${currentMode === 'admin' ? 'active' : ''}`}
          onClick={() => onSelectMode('admin')}
          title="Buka Admin Console (Perlu Password)"
        >
          <img
            src="/assets/scrapbook/tab_admin.png"
            alt="Admin"
            className="tab-illustrated-img"
          />
          <div className="tab-label-with-lock">
            <span className="tab-label">Admin</span>
            {!isAdminUnlocked && (
              <span className="nav-lock-mini-tag">
                <Lock size={10} />
              </span>
            )}
          </div>
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
