import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  Activity,
  Layers,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { Navbar, type AppMode } from './components/common/Navbar';
import { ScannerKiosk } from './components/kiosk/ScannerKiosk';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MemberManager } from './components/admin/MemberManager';
import { ScheduleMatrix } from './components/admin/ScheduleMatrix';
import { ShiftManager } from './components/admin/ShiftManager';
import { AttendanceLog } from './components/admin/AttendanceLog';
import { ReportExport } from './components/admin/ReportExport';
import { SettingsView } from './components/admin/SettingsView';
import { InitialAdminLogin } from './components/auth/InitialAdminLogin';
import { AdminPasswordGate } from './components/auth/AdminPasswordGate';
import { attendanceService } from './services/attendanceService';
import { authService } from './services/authService';
import './styles/index.css';

export function App() {
  const [isInitialized, setIsInitialized] = useState<boolean>(authService.isInitialized());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(authService.isUnlocked());
  const [showPasswordGate, setShowPasswordGate] = useState<boolean>(false);

  const [mode, setMode] = useState<AppMode>('kiosk');
  const [adminTab, setAdminTab] = useState<string>('today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [org] = useState(attendanceService.getOrganization());

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('admin')) {
        if (!authService.isUnlocked()) {
          setShowPasswordGate(true);
        } else {
          setMode('admin');
          const parts = hash.split('/');
          if (parts[1]) setAdminTab(parts[1]);
        }
      } else {
        setMode('kiosk');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectMode = (newMode: AppMode) => {
    if (newMode === 'admin') {
      if (!authService.isUnlocked()) {
        setShowPasswordGate(true);
        return;
      }
    }
    setMode(newMode);
    setMobileMenuOpen(false);
    window.location.hash = newMode;
  };

  const handleUnlockAdmin = () => {
    setIsAdminUnlocked(true);
    setShowPasswordGate(false);
    setMode('admin');
    window.location.hash = `admin/${adminTab}`;
  };

  const handleLockAdmin = () => {
    authService.lockAdmin();
    setIsAdminUnlocked(false);
    setMode('kiosk');
    setMobileMenuOpen(false);
    window.location.hash = 'kiosk';
  };

  const handleSelectAdminTab = (tab: string) => {
    setAdminTab(tab);
    setMobileMenuOpen(false);
    window.location.hash = `admin/${tab}`;
  };

  // Human title for current tab on mobile top bar
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'today':
        return 'Monitoring Hari Ini';
      case 'members':
        return 'Data Karyawan & QR';
      case 'schedule':
        return 'Matriks Jadwal';
      case 'shifts':
        return 'Shift & Toleransi';
      case 'attendance':
        return 'Log Presensi';
      case 'reports':
        return 'Laporan & Ekspor';
      case 'settings':
        return 'Pengaturan';
      default:
        return 'Admin';
    }
  };

  // 1. Initial Launch / First-Time Device Activation Screen
  if (!isInitialized) {
    return (
      <InitialAdminLogin
        onSuccess={() => {
          setIsInitialized(true);
          setMode('kiosk');
          window.location.hash = 'kiosk';
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <Navbar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        orgName={org.display_name}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={handleLockAdmin}
      />

      {/* Main Mode Content */}
      <main className="main-content">
        {mode === 'kiosk' && <ScannerKiosk />}

        {mode === 'admin' && isAdminUnlocked && (
          <div className="admin-layout-wrapper">
            {/* Mobile Admin Navigation Header Bar */}
            <div className="admin-mobile-top-bar">
              <button
                type="button"
                className="admin-mobile-drawer-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                <span>{getTabTitle(adminTab)}</span>
              </button>

              <button
                type="button"
                className="admin-mobile-lock-btn"
                onClick={handleLockAdmin}
                title="Kunci Admin & Kembali ke Kiosk"
              >
                <Lock size={15} />
                <span>Kunci</span>
              </button>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
              <div
                className="admin-sidebar-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}

            <div className="admin-container">
              {/* Admin Sidebar Navigation (Desktop Fixed, Mobile Drawer) */}
              <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-drawer-open' : ''}`}>
                <div className="sidebar-mobile-header">
                  <span>Menu Navigasi Admin</span>
                  <button
                    type="button"
                    className="btn-sidebar-close"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <span className="sidebar-heading">Menu Utama</span>

              <button
                className={`admin-nav-item ${adminTab === 'today' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('today')}
              >
                <Activity size={18} strokeWidth={2} />
                <span>Monitoring Hari Ini</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'members' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('members')}
              >
                <Users size={18} strokeWidth={2} />
                <span>Data Karyawan & QR</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'schedule' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('schedule')}
              >
                <Calendar size={18} strokeWidth={2} />
                <span>Matriks Jadwal</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'shifts' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('shifts')}
              >
                <Layers size={18} strokeWidth={2} />
                <span>Shift Kerja & Toleransi</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'attendance' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('attendance')}
              >
                <Clock size={18} strokeWidth={2} />
                <span>Log & Audit Presensi</span>
              </button>

              <span className="sidebar-heading" style={{ marginTop: 14 }}>
                Laporan & Sistem
              </span>

              <button
                className={`admin-nav-item ${adminTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('reports')}
              >
                <BarChart3 size={18} strokeWidth={2} />
                <span>Laporan & Ekspor CSV</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('settings')}
              >
                <Settings size={18} strokeWidth={2} />
                <span>Pengaturan Organisasi</span>
              </button>

              {/* Single Unified Lock Button */}
              <div className="sidebar-lock-box">
                <button className="btn-sidebar-lock" onClick={handleLockAdmin}>
                  <Lock size={15} strokeWidth={2.2} />
                  <span>Kunci Admin & Ke Kiosk</span>
                </button>
              </div>
            </aside>

            {/* Admin Main Content Area */}
            <section className="admin-content-area">
              {adminTab === 'today' && (
                <AdminDashboard onNavigateTab={handleSelectAdminTab} />
              )}
              {adminTab === 'members' && <MemberManager />}
              {adminTab === 'schedule' && <ScheduleMatrix />}
              {adminTab === 'shifts' && <ShiftManager />}
              {adminTab === 'attendance' && <AttendanceLog />}
              {adminTab === 'reports' && <ReportExport />}
              {adminTab === 'settings' && <SettingsView />}
            </section>
          </div>
        </div>
      )}
      </main>

      {/* Password Gate Dialog (shown when clicking Admin while locked) */}
      {showPasswordGate && (
        <AdminPasswordGate
          onUnlockSuccess={handleUnlockAdmin}
          onCancel={() => setShowPasswordGate(false)}
        />
      )}
    </div>
  );
}

export default App;
