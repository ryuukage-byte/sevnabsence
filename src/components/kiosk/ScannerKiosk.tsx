import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  LogIn,
  LogOut,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Zap,
  Building2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { DigitalClock } from '../common/DigitalClock';
import {
  attendanceService,
  formatBranchTime,
  formatBranchDate
} from '../../services/attendanceService';
import { playSuccessChime, playWarningChime, playErrorChime } from '../../services/audioService';
import type { AttendanceAction, ScanResult, Member, AttendanceRecord } from '../../types/attendance';

export const ScannerKiosk: React.FC = () => {
  const [action, setAction] = useState<AttendanceAction>('MASUK');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [resetTimer, setResetTimer] = useState<number | null>(null);
  const [demoMembers, setDemoMembers] = useState<Member[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const actionRef = useRef<AttendanceAction>(action);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  const loadData = () => {
    setDemoMembers(attendanceService.getMembers());
    setTodayRecords(attendanceService.getTodayRecords());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize camera safely
  useEffect(() => {
    let isMounted = true;
    const scannerId = 'kiosk-reader-view';

    async function initCamera() {
      try {
        setCameraError(null);
        await new Promise((res) => setTimeout(res, 200));
        if (!isMounted) return;

        const scannerElement = document.getElementById(scannerId);
        if (!scannerElement) return;

        const html5QrCode = new Html5Qrcode(scannerId, { verbose: false });
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: 'user' },
          config,
          (decodedText) => {
            if (!isProcessingRef.current) {
              handleQRDetected(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setCameraActive(false);
          const msg =
            err instanceof Error
              ? err.message
              : 'Kamera tidak dapat diakses atau izin ditolak';
          setCameraError(msg);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            scanner.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, []);

  // Handle QR detection
  const handleQRDetected = async (token: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const currentAction = actionRef.current;
      const result = await attendanceService.recordScan(token, currentAction);
      setScanResult(result);
      loadData();

      if (result.success) {
        playSuccessChime();
      } else if (result.code.includes('DUPLICATE')) {
        playWarningChime();
      } else {
        playErrorChime();
      }

      // Auto-reset timer (3 seconds)
      let countdown = 3;
      setResetTimer(countdown);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = window.setInterval(() => {
        countdown -= 1;
        setResetTimer(countdown);
        if (countdown <= 0) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setScanResult(null);
          setResetTimer(null);
          isProcessingRef.current = false;
        }
      }, 1000);
    } catch {
      playErrorChime();
      isProcessingRef.current = false;
    }
  };

  const handleManualDemoScan = (token: string) => {
    if (!token) return;
    handleQRDetected(token);
  };

  const org = attendanceService.getOrganization();
  const tzLabel = org.timezone === 'Asia/Tokyo' ? 'JST' : 'WIB';

  // Last recent attendance
  const lastRecord = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;

  return (
    <div className="kiosk-container">
      <div className="kiosk-card-frame">
        {/* Kiosk Header Bar */}
        <div className="kiosk-header-bar">
          <div className="kiosk-header-left">
            <div className="kiosk-brand-title">
              <span className="kiosk-title-text">Kiosk Presensi Mandiri</span>
              <span className="kiosk-badge-pill">
                <span className="kiosk-pulse-dot" />
                ONLINE • {org.branch_name} ({tzLabel})
              </span>
            </div>
            <p className="kiosk-subtitle">
              Arahkan kartu QR karyawan ke lensa kamera untuk mencatat kehadiran.
            </p>
          </div>

          <DigitalClock timezone={org.timezone} />
        </div>

        {/* Hero Segmented Mode Switcher (Min 48px touch targets) */}
        <div className="kiosk-mode-selector-wrapper">
          <div className="kiosk-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={action === 'MASUK'}
              className={`kiosk-segment-btn masuk ${action === 'MASUK' ? 'active' : ''}`}
              onClick={() => {
                setAction('MASUK');
                setScanResult(null);
                isProcessingRef.current = false;
              }}
            >
              <LogIn size={20} strokeWidth={2.4} />
              <span className="kiosk-segment-label">PRESENSI MASUK</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={action === 'PULANG'}
              className={`kiosk-segment-btn pulang ${action === 'PULANG' ? 'active' : ''}`}
              onClick={() => {
                setAction('PULANG');
                setScanResult(null);
                isProcessingRef.current = false;
              }}
            >
              <LogOut size={20} strokeWidth={2.4} />
              <span className="kiosk-segment-label">PRESENSI PULANG</span>
            </button>
          </div>
        </div>

        {/* Hero Viewfinder Area */}
        <div className="kiosk-hero-camera-area">
          <div className="kiosk-camera-bezel">
            <div className="kiosk-camera-viewport">
              <div id="kiosk-reader-view" />

              {/* Single Clean Reticle */}
              {!scanResult && !cameraError && (
                <div className="scanner-reticle single-reticle">
                  <div className="reticle-corner top-left" />
                  <div className="reticle-corner top-right" />
                  <div className="reticle-corner bottom-left" />
                  <div className="reticle-corner bottom-right" />
                  <div className="scanner-laser-line" />
                </div>
              )}

              {/* Camera Error / Standby Overlay */}
              {cameraError && (
                <div className="camera-error-overlay">
                  <AlertCircle size={40} color="var(--accent-terracotta)" strokeWidth={2} />
                  <h3>Kamera Belum Aktif</h3>
                  <p>{cameraError}</p>
                  {import.meta.env.DEV && (
                    <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      [DEV MODE] Anda dapat menggunakan simulasi kartu di bawah untuk uji coba.
                    </p>
                  )}
                </div>
              )}

              {/* Tactile Stamped Seal Result Overlay */}
              {scanResult && (
                <div
                  className={`scan-feedback-overlay tactile-stamp-overlay ${
                    scanResult.success ? 'feedback-success' : 'feedback-warning'
                  }`}
                >
                  <div className="tactile-stamp-badge">
                    <div className="stamp-icon-tile">
                      {scanResult.success ? (
                        <CheckCircle2 size={44} strokeWidth={2.5} />
                      ) : (
                        <AlertCircle size={44} strokeWidth={2.5} />
                      )}
                    </div>

                    <div className="stamp-title-seal">
                      {scanResult.success
                        ? action === 'MASUK'
                          ? 'HADIR TERCATAT'
                          : 'PULANG TERCATAT'
                        : 'PERHATIAN'}
                    </div>

                    {scanResult.member_name && (
                      <div className="feedback-member-name">{scanResult.member_name}</div>
                    )}

                    <p className="feedback-message">{scanResult.message}</p>

                    {scanResult.timestamp && (
                      <div className="stamp-timestamp">
                        Waktu Server: {formatBranchTime(scanResult.timestamp, org.timezone, true)}{' '}
                        {tzLabel}
                      </div>
                    )}

                    {resetTimer !== null && (
                      <div className="stamp-countdown">
                        Siap memindai lagi ({resetTimer}s)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Viewfinder Contextual Instruction */}
            <div className="camera-bezel-footer">
              <Camera size={16} strokeWidth={2} />
              <span>
                {scanResult
                  ? 'Menunggu pemindaian berikutnya...'
                  : `Arahkan kartu QR untuk Presensi ${action}`}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Recent Activity Bar */}
        <div className="kiosk-status-strip">
          <div className="kiosk-strip-info">
            <Clock size={15} strokeWidth={2} />
            <span>Aktivitas Terakhir:</span>
            {lastRecord ? (
              <span className="strip-record-text">
                <strong>{lastRecord.member_name}</strong> •{' '}
                {lastRecord.check_out_at
                  ? `Pulang ${formatBranchTime(lastRecord.check_out_at, org.timezone)}`
                  : `Masuk ${formatBranchTime(lastRecord.check_in_at, org.timezone)}`}{' '}
                {tzLabel}
              </span>
            ) : (
              <span className="strip-record-text muted">Belum ada presensi tercatat hari ini</span>
            )}
          </div>
          <div className="kiosk-device-health">
            <ShieldCheck size={14} strokeWidth={2} color="var(--accent-sage)" />
            <span>Sistem Aman • JST UTC+9</span>
          </div>
        </div>

        {/* Developer Only Quick Simulation (Hidden in Production) */}
        {import.meta.env.DEV && (
          <div className="kiosk-dev-simulation-tray">
            <div className="dev-tray-label">
              <Zap size={13} strokeWidth={2.4} />
              <span>[DEV ONLY] Uji Presensi Cepat:</span>
            </div>
            <div className="dev-chips-row">
              {demoMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="dev-chip-btn"
                  onClick={() => handleManualDemoScan(m.active_token || '')}
                  title={`Simulasi scan kartu ${m.full_name}`}
                >
                  <User size={12} strokeWidth={2} />
                  <span>{m.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
