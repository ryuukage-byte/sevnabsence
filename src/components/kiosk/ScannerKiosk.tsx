import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  LogIn,
  LogOut,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Check,
  User,
  Zap
} from 'lucide-react';
import { DigitalClock } from '../common/DigitalClock';
import { attendanceService } from '../../services/attendanceService';
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

  // Initialize camera
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
          fps: 10,
          qrbox: { width: 250, height: 250 },
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
              : 'Kamera depan tidak dapat diakses atau izin ditolak';
          setCameraError(msg);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
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
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 }
        });
      } else if (result.code.includes('DUPLICATE')) {
        playWarningChime();
      } else {
        playErrorChime();
      }

      // Auto-reset timer (3s)
      let countdown = 3;
      setResetTimer(countdown);
      const interval = setInterval(() => {
        countdown -= 1;
        setResetTimer(countdown);
        if (countdown <= 0) {
          clearInterval(interval);
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
  const getMemberById = (id: string) => demoMembers.find((m) => m.id === id);

  return (
    <div className="kiosk-container">
      <div className="kiosk-card-frame">
        {/* Kiosk Header Bar */}
        <div className="kiosk-header-bar">
          <div>
            <div className="kiosk-brand-title">
              <span>Kiosk Presensi Mandiri</span>
              <span className="kiosk-badge-pill">ONLINE • AKTIF</span>
            </div>
            <p className="kiosk-subtitle">
              Sistem absensi cepat & aman cabang <strong>{org.display_name}</strong>. Cukup tunjukkan kartu QR ke kamera.
            </p>
          </div>

          {/* Minimalist Tactile Digital Clock */}
          <DigitalClock />
        </div>

        {/* Main Grid: Actions & Viewfinder */}
        <div className="kiosk-grid">
          {/* Left Column: Action Selectors & Status */}
          <div className="kiosk-left-panel">
            {/* Tactile Action Buttons */}
            <div className="action-buttons-group">
              <button
                className={`tactile-action-btn masuk ${action === 'MASUK' ? 'active' : ''}`}
                onClick={() => {
                  setAction('MASUK');
                  setScanResult(null);
                  isProcessingRef.current = false;
                }}
              >
                <div className="action-icon-tile">
                  <LogIn size={26} strokeWidth={2.4} />
                </div>
                <div>
                  <span className="btn-title">PRESENSI MASUK</span>
                  <span className="btn-subtext">Mulai jam kerja • Catat waktu hadir</span>
                </div>
              </button>

              <button
                className={`tactile-action-btn pulang ${action === 'PULANG' ? 'active' : ''}`}
                onClick={() => {
                  setAction('PULANG');
                  setScanResult(null);
                  isProcessingRef.current = false;
                }}
              >
                <div className="action-icon-tile">
                  <LogOut size={26} strokeWidth={2.4} />
                </div>
                <div>
                  <span className="btn-title">PRESENSI PULANG</span>
                  <span className="btn-subtext">Selesai dinas • Catat waktu pulang</span>
                </div>
              </button>
            </div>

            {/* Status / Instructions Card */}
            <div className="kiosk-status-card">
              <div className="kiosk-status-icon">
                <Camera size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="kiosk-status-title">Mode Aktif: Presensi {action}</div>
                <div className="kiosk-status-text">
                  Posisikan kartu QR karyawan di dalam kotak pemindai kamera depan. Presensi diproses dalam 0.3 detik.
                </div>
              </div>
            </div>

            {/* Quick Demo Simulator */}
            <div className="kiosk-demo-box">
              <div className="demo-title">
                <Zap size={14} strokeWidth={2.2} />
                <span>Simulasi Cepat (Klik Kartu Demo):</span>
              </div>
              <div className="demo-chips-grid">
                {demoMembers.map((m) => (
                  <button
                    key={m.id}
                    className="tactile-chip-btn"
                    onClick={() => handleManualDemoScan(m.active_token || '')}
                    title={`Scan ${m.full_name}`}
                  >
                    <User size={13} strokeWidth={2} />
                    <span>{m.full_name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hardware Tablet Bezel Camera */}
          <div className="kiosk-camera-bezel">
            <div className="kiosk-camera-viewport">
              <div id="kiosk-reader-view" />

              {!scanResult && !cameraError && (
                <div className="scanner-reticle">
                  <div className="reticle-corner top-left" />
                  <div className="reticle-corner top-right" />
                  <div className="reticle-corner bottom-left" />
                  <div className="reticle-corner bottom-right" />
                  <div className="scanner-laser-line" />
                </div>
              )}

              {cameraError && (
                <div className="camera-error-overlay">
                  <AlertCircle size={40} color="#C9944A" strokeWidth={2} />
                  <h3>Kamera Belum Aktif</h3>
                  <p>{cameraError}</p>
                  <p style={{ marginTop: 8, fontSize: '0.78rem', color: '#A69B91' }}>
                    Gunakan tombol Simulasi Cepat di sebelah kiri untuk menguji presensi tanpa webcam.
                  </p>
                </div>
              )}

              {/* Scan Feedback Overlay */}
              {scanResult && (
                <div
                  className={`scan-feedback-overlay ${
                    scanResult.success ? 'feedback-success' : 'feedback-warning'
                  }`}
                >
                  <div className="feedback-content">
                    <div className="feedback-icon-tile">
                      {scanResult.success ? (
                        <CheckCircle2 size={36} strokeWidth={2.5} />
                      ) : (
                        <AlertCircle size={36} strokeWidth={2.5} />
                      )}
                    </div>
                    <h2 className="feedback-title">
                      {scanResult.success ? 'Presensi Berhasil!' : 'Perhatian'}
                    </h2>
                    {scanResult.member_name && (
                      <div className="feedback-member-name">{scanResult.member_name}</div>
                    )}
                    <p className="feedback-message">{scanResult.message}</p>
                    {scanResult.timestamp && (
                      <div style={{ marginTop: 8, fontSize: '0.82rem', opacity: 0.9 }}>
                        Waktu Server:{' '}
                        {new Date(scanResult.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}{' '}
                        WIB
                      </div>
                    )}
                    {resetTimer !== null && (
                      <div className="feedback-countdown">
                        Siap memindai kembali dalam {resetTimer} detik...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="camera-bezel-footer">
              <Camera size={16} strokeWidth={2} />
              <span>Arahkan kode QR ke lensa kamera</span>
            </div>
          </div>
        </div>

        {/* Live Attendance Stream */}
        <div className="kiosk-recent-stream">
          <div className="stream-header">
            <Clock size={16} strokeWidth={2} />
            <span>Presensi Terkini Hari Ini (Real-Time)</span>
          </div>
          <div className="stream-cards-row">
            {todayRecords.length > 0 ? (
              todayRecords.slice(-4).map((rec) => {
                const member = getMemberById(rec.member_id);
                const time = rec.check_in_at
                  ? new Date(rec.check_in_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '--:--';
                return (
                  <div key={rec.id} className="stream-card-item">
                    <div className="stream-avatar-circle">
                      {member?.full_name.charAt(0) || '👤'}
                    </div>
                    <div>
                      <span className="stream-name">{member?.full_name || 'Karyawan'}</span>
                      <span className="stream-time">{time} WIB • Masuk</span>
                    </div>
                  </div>
                );
              })
            ) : (
              demoMembers.slice(0, 3).map((m) => (
                <div key={m.id} className="stream-card-item" style={{ opacity: 0.65 }}>
                  <div className="stream-avatar-circle">{m.full_name.charAt(0)}</div>
                  <div>
                    <span className="stream-name">{m.full_name}</span>
                    <span className="stream-time">Siap presensi</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
