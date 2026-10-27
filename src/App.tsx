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
  X,
  Building,
  UserCog,
  Wand2,
  CalendarHeart,
  Inbox
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
import { FacilityManager } from './components/admin/FacilityManager';
import { StaffIdentity } from './components/admin/StaffIdentity';
import { ScheduleBuilder } from './components/admin/ScheduleBuilder';
import { RequestsManager } from './components/admin/RequestsManager';
import { MessageCenter } from './components/common/MessageCenter';
import { MemberPortal } from './components/member/MemberPortal';
import { attendanceService } from './services/attendanceService';
import { facilityService } from './services/facilityService';
import { useFacility } from './hooks/useFacility';
import { ADMIN_SENDER } from './types/facility';
import { authService } from './services/authService';

export function App() {
  const [isInitialized, setIsInitialized] = useState<boolean>(authService.isInitialized());
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(authService.isUnlocked());
  const [showPasswordGate, setShowPasswordGate] = useState<boolean>(false);

  const [mode, setMode] = useState<AppMode>('kiosk');
  const [adminTab, setAdminTab] = useState<string>('today');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [org] = useState(attendanceService.getOrganization());
  useFacility();
  const pendingRequests =
    facilityService.getOffRequests({ status: 'PENDING' }).length +
    facilityService.getLeaveRequests({ status: 'PENDING' }).length;
  const adminUnread = facilityService.unreadCount(ADMIN_SENDER);

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
      } else if (hash.startsWith('member')) {
        setMode('member');
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

  const navItem = (tab: string, icon: React.ReactNode, label: string, badge?: number) => (
    <button className={`admin-nav-item ${adminTab === tab ? 'active' : ''}`} onClick={() => handleSelectAdminTab(tab)}>
      {icon}
      <span>{label}</span>
      {!!badge && <span className="kg-count kg-count-nav">{badge}</span>}
    </button>
  );

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
      case 'facility':
        return 'Profil Fasilitas';
      case 'staff':
        return 'Identitas Staf';
      case 'builder':
        return 'Pembuat Jadwal';
      case 'requests':
        return 'Pengajuan';
      case 'inbox':
        return 'Kotak Pesan';
      default:
        return 'Admin';
    }
  };

  // 1. Initial Launch / First-Time Device Activation Screen (member portal runs on staff phones, no device setup)
  if (!isInitialized && mode !== 'member') {
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
        {mode === 'member' && <MemberPortal />}

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

                <span className="sidebar-heading">Operasional</span>
                {navItem('today', <Activity size={18} strokeWidth={2} />, 'Monitoring Hari Ini')}
                {navItem('attendance', <Clock size={18} strokeWidth={2} />, 'Log & Audit Presensi')}
                {navItem('requests', <CalendarHeart size={18} strokeWidth={2} />, 'Pengajuan Libur & Cuti', pendingRequests)}
                {navItem('inbox', <Inbox size={18} strokeWidth={2} />, 'Kotak Pesan', adminUnread)}

                <span className="sidebar-heading" style={{ marginTop: 14 }}>
                  Shisetsu & Jadwal
                </span>
                {navItem('facility', <Building size={18} strokeWidth={2} />, 'Profil Fasilitas')}
                {navItem('staff', <UserCog size={18} strokeWidth={2} />, 'Identitas Staf')}
                {navItem('builder', <Wand2 size={18} strokeWidth={2} />, 'Pembuat Jadwal')}
                {navItem('schedule', <Calendar size={18} strokeWidth={2} />, 'Matriks Jadwal')}
                {navItem('shifts', <Layers size={18} strokeWidth={2} />, 'Shift Kerja & Toleransi')}

                <span className="sidebar-heading" style={{ marginTop: 14 }}>
                  Data & Sistem
                </span>
                {navItem('members', <Users size={18} strokeWidth={2} />, 'Data Karyawan & QR')}
                {navItem('reports', <BarChart3 size={18} strokeWidth={2} />, 'Laporan & Ekspor CSV')}
                {navItem('settings', <Settings size={18} strokeWidth={2} />, 'Pengaturan Organisasi')}

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
              {adminTab === 'facility' && <FacilityManager />}
              {adminTab === 'staff' && <StaffIdentity />}
              {adminTab === 'builder' && <ScheduleBuilder onOpenMatrix={() => handleSelectAdminTab('schedule')} />}
              {adminTab === 'requests' && <RequestsManager />}
              {adminTab === 'inbox' && <MessageCenter viewer={ADMIN_SENDER} />}
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
