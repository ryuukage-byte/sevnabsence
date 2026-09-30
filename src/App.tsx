import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Clock,
  FileText,
  BarChart3,
  Settings,
  Activity,
  Layers
} from 'lucide-react';
import { Navbar, AppMode } from './components/common/Navbar';
import { ScannerKiosk } from './components/kiosk/ScannerKiosk';
import { MemberDashboard } from './components/member/MemberDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MemberManager } from './components/admin/MemberManager';
import { ScheduleMatrix } from './components/admin/ScheduleMatrix';
import { ShiftManager } from './components/admin/ShiftManager';
import { AttendanceLog } from './components/admin/AttendanceLog';
import { ReportExport } from './components/admin/ReportExport';
import { SettingsView } from './components/admin/SettingsView';
import { attendanceService } from './services/attendanceService';
import './styles/index.css';

export function App() {
  const [mode, setMode] = useState<AppMode>('kiosk');
  const [adminTab, setAdminTab] = useState<string>('today');
  const [org, setOrg] = useState(attendanceService.getOrganization());

  useEffect(() => {
    // Listen to hash changes if present
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'member') setMode('member');
      else if (hash.startsWith('admin')) {
        setMode('admin');
        const parts = hash.split('/');
        if (parts[1]) setAdminTab(parts[1]);
      } else {
        setMode('kiosk');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectMode = (newMode: AppMode) => {
    setMode(newMode);
    window.location.hash = newMode;
  };

  const handleSelectAdminTab = (tab: string) => {
    setAdminTab(tab);
    window.location.hash = `admin/${tab}`;
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        orgName={org.display_name}
      />

      {/* Main Mode Content */}
      <main className="main-content">
        {mode === 'kiosk' && <ScannerKiosk />}

        {mode === 'member' && <MemberDashboard />}

        {mode === 'admin' && (
          <div className="admin-container">
            {/* Admin Sidebar Navigation */}
            <aside className="admin-sidebar">
              <span className="sidebar-heading">Menu Utama</span>

              <button
                className={`admin-nav-item ${adminTab === 'today' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('today')}
              >
                <Activity size={18} />
                <span>Monitoring Hari Ini</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'members' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('members')}
              >
                <Users size={18} />
                <span>Data Karyawan & QR</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'schedule' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('schedule')}
              >
                <Calendar size={18} />
                <span>Matriks Jadwal</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'shifts' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('shifts')}
              >
                <Layers size={18} />
                <span>Shift Kerja & Toleransi</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'attendance' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('attendance')}
              >
                <Clock size={18} />
                <span>Log & Audit Presensi</span>
              </button>

              <span className="sidebar-heading" style={{ marginTop: 12 }}>
                Laporan & Sistem
              </span>

              <button
                className={`admin-nav-item ${adminTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('reports')}
              >
                <BarChart3 size={18} />
                <span>Laporan & Ekspor CSV</span>
              </button>

              <button
                className={`admin-nav-item ${adminTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleSelectAdminTab('settings')}
              >
                <Settings size={18} />
                <span>Pengaturan Organisasi</span>
              </button>
            </aside>

            {/* Admin View Area */}
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
        )}
      </main>
    </div>
  );
}

export default App;
