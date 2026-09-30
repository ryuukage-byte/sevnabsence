import React from 'react';
import { QrCode, User, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export type AppMode = 'kiosk' | 'member' | 'admin';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  orgName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentMode, onSelectMode, orgName }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo-icon">
          <Sparkles size={20} color="#4F46E5" />
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
          <ShieldCheck size={18} />
          <span>Admin</span>
        </button>
      </nav>
    </header>
  );
};
