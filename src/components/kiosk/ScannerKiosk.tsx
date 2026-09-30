import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { LogIn, LogOut, Camera, AlertCircle, CheckCircle2, RefreshCw, Tablet, Clock, Info } from 'lucide-react';
import { DigitalClock } from '../common/DigitalClock';
import { Mascot, type MascotState } from '../common/Mascot';
import { attendanceService } from '../../services/attendanceService';
import { playSuccessChime, playWarningChime, playErrorChime } from '../../services/audioService';
import type { AttendanceAction, ScanResult, Member } from '../../types/attendance';

export const ScannerKiosk: React.FC = () => {
  const [action, setAction] = useState<AttendanceAction>('MASUK');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>('scanning');
  const [resetTimer, setResetTimer] = useState<number | null>(null);
  const [demoMembers, setDemoMembers] = useState<Member[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const actionRef = useRef<AttendanceAction>(action);

  // Keep actionRef in sync with state
  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    setDemoMembers(attendanceService.getMembers());
  }, []);

  // Initialize Camera ONCE on Mount (does not tear down on action change!)
  useEffect(() => {
    let isMounted = true;
    const scannerId = 'kiosk-reader-view';

    async function initCamera() {
      try {
        setCameraError(null);
        // Small delay to ensure container element is mounted in DOM
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
          () => {
            // Frame processing pass
          }
        );

        if (isMounted) {
          setCameraActive(true);
          setMascotState('scanning');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setCameraActive(false);
          const msg =
            err instanceof Error
              ? err.message
              : 'Kamera depan tidak dapat diakses atau izin ditolak';
          setCameraError(msg);
          setMascotState('idle');
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
        } catch {
          // ignore
        }
      }
    };
  }, []); // Run only ONCE on mount

  // Handle QR scan resolution
  const handleQRDetected = async (token: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setMascotState('validating');

    try {
      const currentAction = actionRef.current;
      const result = await attendanceService.recordScan(token, currentAction);
      setScanResult(result);

      if (result.success) {
        setMascotState('success');
        playSuccessChime();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else if (result.code.includes('DUPLICATE')) {
        setMascotState('duplicate');
        playWarningChime();
      } else {
        setMascotState('error');
        playErrorChime();
      }

      // Auto-reset countdown (3 seconds)
      let countdown = 3;
      setResetTimer(countdown);
      const interval = setInterval(() => {
        countdown -= 1;
        setResetTimer(countdown);
        if (countdown <= 0) {
          clearInterval(interval);
          setScanResult(null);
          setMascotState('scanning');
          setResetTimer(null);
          isProcessingRef.current = false;
        }
      }, 1000);
    } catch {
      setMascotState('error');
      playErrorChime();
      isProcessingRef.current = false;
    }
  };

  const handleManualDemoScan = (token: string) => {
    if (!token) return;
    handleQRDetected(token);
  };

  return (
    <div className="kiosk-container">
      {/* Top Banner / Live Clock & Branding */}
      <div className="kiosk-header-row">
        <div className="kiosk-welcome-card">
          <div className="welcome-tag">
            <Tablet size={16} /> Tablet Attendance Kiosk
          </div>
          <h1 className="kiosk-org-title">{attendanceService.getOrganization().display_name}</h1>
          <p className="kiosk-instructions">
            Pilih tindakan, lalu arahkan kartu QR ke kamera depan.
          </p>
        </div>
        <DigitalClock />
      </div>

      {/* Main Kiosk Interaction Layout */}
      <div className="kiosk-main-grid">
        {/* Left Column: Action Switcher & Mascot */}
        <div className="kiosk-left-panel">
          <div className="action-buttons-group">
            <button
              className={`action-btn action-masuk ${action === 'MASUK' ? 'active' : ''}`}
              onClick={() => {
                setAction('MASUK');
                setScanResult(null);
                isProcessingRef.current = false;
              }}
            >
              <div className="btn-icon-wrapper">
                <LogIn size={32} />
              </div>
              <div className="btn-text-wrapper">
                <span className="btn-label">PRESENSI MASUK</span>
                <span className="btn-subtext">Mulai shift kerja hari ini</span>
              </div>
            </button>

            <button
              className={`action-btn action-pulang ${action === 'PULANG' ? 'active' : ''}`}
              onClick={() => {
                setAction('PULANG');
                setScanResult(null);
                isProcessingRef.current = false;
              }}
            >
              <div className="btn-icon-wrapper">
                <LogOut size={32} />
              </div>
              <div className="btn-text-wrapper">
                <span className="btn-label">PRESENSI PULANG</span>
                <span className="btn-subtext">Selesai jam kerja & istirahat</span>
              </div>
            </button>
          </div>

          {/* Interactive Mascot & Guidance */}
          <div className="kiosk-mascot-card">
            <Mascot state={mascotState} size={110} />
            <div className="mascot-speech">
              <span className="mascot-name">Koji the Timekeeper</span>
              <p className="mascot-text">
                {mascotState === 'scanning' && `Sedang siap memindai untuk presensi ${action}...`}
                {mascotState === 'validating' && 'Memeriksa keabsahan kartu di server...'}
                {mascotState === 'success' && 'Presensi berhasil dicatat! Kerja bagus!'}
                {mascotState === 'duplicate' && 'Ups! Presensi sudah tercatat sebelumnya.'}
                {mascotState === 'error' && 'Kartu tidak terbaca atau terjadi kesalahan.'}
                {mascotState === 'idle' && 'Silakan arahkan kartu QR ke kamera.'}
              </p>
            </div>
          </div>

          {/* Quick Demo Simulator */}
          <div className="kiosk-demo-simulator">
            <div className="simulator-title">
              <RefreshCw size={14} /> Simulasi Scan Cepat (Klik Kartu Demo):
            </div>
            <div className="simulator-buttons">
              {demoMembers.map((m) => (
                <button
                  key={m.id}
                  className="demo-scan-btn"
                  onClick={() => handleManualDemoScan(m.active_token || '')}
                  title={`Scan kartu ${m.full_name}`}
                >
                  Scan {m.full_name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Front-Camera Viewfinder & Feedback Overlay */}
        <div className="kiosk-camera-panel">
          <div className="viewfinder-wrapper">
            {/* HTML5 QR Camera Target */}
            <div id="kiosk-reader-view" className="kiosk-camera-viewport" />

            {/* Target Alignment Reticle Guide */}
            {!scanResult && !cameraError && (
              <div className="scanner-reticle">
                <div className="reticle-corner top-left" />
                <div className="reticle-corner top-right" />
                <div className="reticle-corner bottom-left" />
                <div className="reticle-corner bottom-right" />
                <div className="scanner-laser-line" />
              </div>
            )}

            {/* Camera Permission / Error Fallback */}
            {cameraError && (
              <div className="camera-error-overlay">
                <AlertCircle size={44} color="#F59E0B" />
                <h3>Akses Kamera Belum Aktif</h3>
                <p>{cameraError}</p>
                <div className="camera-fallback-card">
                  <Info size={16} />
                  <span>
                    Anda tetap dapat menguji seluruh alur presensi menggunakan tombol{' '}
                    <strong>Simulasi Scan Cepat</strong> di sebelah kiri.
                  </span>
                </div>
              </div>
            )}

            {/* Scan Feedback Overlay Modal */}
            {scanResult && (
              <div
                className={`scan-feedback-overlay ${
                  scanResult.success ? 'feedback-success' : 'feedback-warning'
                }`}
              >
                <div className="feedback-content">
                  {scanResult.success ? (
                    <div className="feedback-icon success-icon">
                      <CheckCircle2 size={54} color="#10B981" />
                    </div>
                  ) : (
                    <div className="feedback-icon warning-icon">
                      <AlertCircle size={54} color="#F59E0B" />
                    </div>
                  )}

                  <h2 className="feedback-title">
                    {scanResult.success ? 'Berhasil Dicatat!' : 'Perhatian'}
                  </h2>

                  {scanResult.member_name && (
                    <div className="feedback-member-name">{scanResult.member_name}</div>
                  )}

                  <p className="feedback-message">{scanResult.message}</p>

                  {scanResult.timestamp && (
                    <div className="feedback-meta">
                      <Clock size={16} />
                      <span>
                        Waktu Server:{' '}
                        {new Date(scanResult.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}{' '}
                        WIB
                      </span>
                    </div>
                  )}

                  {resetTimer !== null && (
                    <div className="feedback-countdown">
                      Kembali ke layar pemindai dalam {resetTimer} detik...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="camera-footer-hint">
            <Camera size={16} />
            <span>Kamera Depan Aktif (Tampilan Cermin Otomatis)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
