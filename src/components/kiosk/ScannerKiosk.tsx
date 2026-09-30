import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  LogIn,
  LogOut,
  Camera,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Tablet,
  Clock,
  Info,
  Sparkles,
  Paperclip,
  Check
} from 'lucide-react';
import { DigitalClock } from '../common/DigitalClock';
import { Mascot, type MascotState } from '../common/Mascot';
import { attendanceService } from '../../services/attendanceService';
import { playSuccessChime, playWarningChime, playErrorChime } from '../../services/audioService';
import type { AttendanceAction, ScanResult, Member, AttendanceRecord } from '../../types/attendance';

export const ScannerKiosk: React.FC = () => {
  const [action, setAction] = useState<AttendanceAction>('MASUK');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [mascotState, setMascotState] = useState<MascotState>('scanning');
  const [resetTimer, setResetTimer] = useState<number | null>(null);
  const [demoMembers, setDemoMembers] = useState<Member[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const actionRef = useRef<AttendanceAction>(action);

  // Keep actionRef in sync with state
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

  // Initialize Camera ONCE on Mount
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
          qrbox: { width: 240, height: 240 },
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
        } catch {}
      }
    };
  }, []);

  // Handle QR scan resolution
  const handleQRDetected = async (token: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setMascotState('validating');

    try {
      const currentAction = actionRef.current;
      const result = await attendanceService.recordScan(token, currentAction);
      setScanResult(result);
      loadData();

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

  const org = attendanceService.getOrganization();

  // Mini helper to find member details
  const getMemberById = (id: string) => demoMembers.find((m) => m.id === id);

  return (
    <div className="kiosk-container">
      {/* Outer Adventure Scrapbook Leather Binder */}
      <div className="scrapbook-leather-binder">
        {/* Binder Corner Accents & Stickers */}
        <img
          src="/assets/scrapbook/clip_binder_bronze.png"
          alt="Bronze Binder Clip"
          className="binder-corner-clip-left"
        />
        <img
          src="/assets/scrapbook/washi_floral_green.png"
          alt="Floral Washi Tape"
          className="binder-top-washi"
        />
        <img
          src="/assets/scrapbook/sticker_bunny_kawaii.png"
          alt="Bunny Sticker"
          className="binder-corner-bunny"
        />
        <img
          src="/assets/scrapbook/sticker_cloud_stars.png"
          alt="Cloud Stars"
          className="binder-corner-cloud"
        />

        {/* Leather Stitching Trim */}
        <div className="binder-stitch-outer">
          {/* Ring Binder / Grommet Spine on Left */}
          <div className="binder-spine-strip">
            <div className="grommet-eyelet"><div className="grommet-ring" /></div>
            <div className="grommet-eyelet"><div className="grommet-ring" /></div>
            <div className="grommet-eyelet"><div className="grommet-ring" /></div>
            <div className="grommet-eyelet"><div className="grommet-ring" /></div>
          </div>

          {/* Main Cream Graph Paper Sheet */}
          <div className="scrapbook-inner-sheet">
            {/* Hanging Illustrated Luggage Tag Bookmark */}
            <div className="luggage-tag-bookmark-wrap">
              <img
                src="/assets/scrapbook/panel_luggage_tag.png"
                alt="Luggage Tag"
                className="luggage-tag-img"
              />
              <div className="luggage-tag-overlay-text">
                <span className="luggage-tag-title">CABANG RESMI</span>
                <span className="luggage-tag-brand">{org.branch_name}</span>
              </div>
            </div>

            {/* Faint Paw Print Stamps Across the Sheet */}
            <img
              src="/assets/scrapbook/sticker_paw_orange.png"
              alt="paw"
              className="paw-print-stamp"
              style={{ top: 70, left: 240, width: 32, opacity: 0.28, transform: 'rotate(25deg)' }}
            />
            <img
              src="/assets/scrapbook/sticker_paw_orange.png"
              alt="paw"
              className="paw-print-stamp"
              style={{ top: 120, left: 320, width: 28, opacity: 0.22, transform: 'rotate(40deg)' }}
            />
            <img
              src="/assets/scrapbook/sticker_paw_orange.png"
              alt="paw"
              className="paw-print-stamp"
              style={{ top: 170, left: 410, width: 34, opacity: 0.25, transform: 'rotate(30deg)' }}
            />

            {/* Dossier Header Bar */}
            <div className="dossier-header-bar">
              <div>
                <div className="dossier-title-group">
                  <h1 className="dossier-main-title">柯哒基 • Koji Dossier</h1>
                  <span className="dossier-sub-badge">KIOSK PRESENSI v1.0</span>
                  <img
                    src="/assets/scrapbook/bow_coral.png"
                    alt="Coral Bow"
                    style={{ height: 26, marginLeft: 8 }}
                  />
                </div>
                <p className="dossier-tagline">
                  “Siap memotret dan memvalidasi presensi seluruh staf dengan cepat, aman, dan tanpa manipulasi jam!”
                </p>
                <div className="dossier-tags-row">
                  <span className="dossier-pill-tag">
                    <img src="/assets/scrapbook/icon_sparkle.png" alt="*" style={{ width: 14, height: 14 }} />
                    Presensi Instan 0.3 Detik
                  </span>
                  <span className="dossier-pill-tag">
                    <img src="/assets/scrapbook/icon_sparkle.png" alt="*" style={{ width: 14, height: 14 }} />
                    Kamera Depan Mirror
                  </span>
                  <span className="dossier-pill-tag">
                    <img src="/assets/scrapbook/icon_sparkle.png" alt="*" style={{ width: 14, height: 14 }} />
                    Anti-Titip Absen
                  </span>
                </div>
              </div>

              {/* Retro Scrapbook Desk Clock */}
              <DigitalClock />
            </div>

            {/* Main Scrapbook Two-Column Grid */}
            <div className="kiosk-main-grid">
              {/* Left Column: Actions & Koji Character Sticker */}
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
                      <img
                        src="/assets/scrapbook/btn_green_play.png"
                        alt="Play"
                        className="btn-illustrated-stamp"
                      />
                    </div>
                    <div className="btn-text-wrapper">
                      <span className="btn-label">PRESENSI MASUK</span>
                      <span className="btn-subtext">Mulai jam kerja • Stempel Hadir</span>
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
                      <img
                        src="/assets/scrapbook/btn_orange_plus.png"
                        alt="Plus"
                        className="btn-illustrated-stamp"
                      />
                    </div>
                    <div className="btn-text-wrapper">
                      <span className="btn-label">PRESENSI PULANG</span>
                      <span className="btn-subtext">Selesai dinas • Istirahat & Pulang</span>
                    </div>
                  </button>
                </div>

                {/* Illustrated Mascot Card with Dialogue Balloon Frame */}
                <div className="kiosk-mascot-card">
                  <Mascot state={mascotState} size={135} />
                  <div className="mascot-speech-bubble-container">
                    <img
                      src="/assets/scrapbook/panel_speech_bubble.png"
                      alt="Speech Frame"
                      className="speech-bubble-bg-img"
                    />
                    <div className="mascot-speech-content">
                      <span className="mascot-name">Koji the Timekeeper</span>
                      <p className="mascot-text">
                        {mascotState === 'scanning' && `Arahkan kartu QR Anda ke kamera untuk presensi ${action}...`}
                        {mascotState === 'validating' && 'Memeriksa keabsahan kode QR di database...'}
                        {mascotState === 'success' && 'Presensi tercatat sukses! Selamat beraktivitas!'}
                        {mascotState === 'duplicate' && 'Ups! Presensi Anda sudah dicatat sebelumnya.'}
                        {mascotState === 'error' && 'Kode tidak terbaca atau terjadi kendala jaringan.'}
                        {mascotState === 'idle' && 'Silakan tunjukkan kartu QR Anda ke kamera.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Demo Simulator Stamps */}
                <div className="kiosk-demo-simulator">
                  <div className="simulator-title">
                    <img
                      src="/assets/scrapbook/clip_pushpin_yellow.png"
                      alt="Pin"
                      style={{ width: 18, height: 18 }}
                    />
                    Simulasi Scan Cepat (Klik Kartu Karyawan Demo):
                  </div>
                  <div className="simulator-buttons">
                    {demoMembers.map((m) => (
                      <button
                        key={m.id}
                        className="demo-scan-btn"
                        onClick={() => handleManualDemoScan(m.active_token || '')}
                        title={`Scan kartu ${m.full_name}`}
                      >
                        <img
                          src="/assets/scrapbook/icon_user.png"
                          alt="user"
                          style={{ width: 14, height: 14, marginRight: 4 }}
                        />
                        Scan {m.full_name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Front-Camera Framed as a Polaroid Photo */}
              <div className="kiosk-camera-panel">
                <div className="polaroid-camera-card">
                  {/* Decorative Washi Tape & Brass Paperclip Pins */}
                  <img
                    src="/assets/scrapbook/clip_binder_blue.png"
                    alt="Blue Clip"
                    className="polaroid-clip-img"
                  />
                  <img
                    src="/assets/scrapbook/washi_hearts_peach.png"
                    alt="Peach Washi"
                    className="polaroid-tape-img"
                  />

                  {/* Camera Viewport Screen */}
                  <div className="polaroid-viewport-screen">
                    <div id="kiosk-reader-view" className="kiosk-camera-viewport" />

                    {/* Illustrated Polaroid Cutout Frame Overlay */}
                    <img
                      src="/assets/scrapbook/polaroid_frame.png"
                      alt="Polaroid Frame"
                      className="polaroid-diecut-frame-overlay"
                    />

                    {!scanResult && !cameraError && (
                      <div className="scanner-reticle">
                        <div className="reticle-corner top-left" />
                        <div className="reticle-corner top-right" />
                        <div className="reticle-corner bottom-left" />
                        <div className="reticle-corner bottom-right" />
                      </div>
                    )}

                    {cameraError && (
                      <div className="camera-error-overlay">
                        <AlertCircle size={44} color="#F59E0B" />
                        <h3>Akses Kamera Belum Aktif</h3>
                        <p>{cameraError}</p>
                        <div className="camera-fallback-card">
                          <Info size={16} />
                          <span>
                            Gunakan tombol <strong>Simulasi Scan Cepat</strong> di sebelah kiri untuk mencoba presensi.
                          </span>
                        </div>
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
                          {scanResult.success ? (
                            <div className="feedback-icon success-icon">
                              <CheckCircle2 size={54} color="#244E52" />
                            </div>
                          ) : (
                            <div className="feedback-icon warning-icon">
                              <AlertCircle size={54} color="#6D4E1F" />
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
                              Layar pemindai siap kembali dalam {resetTimer} detik...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Polaroid Bottom Caption Chin */}
                  <div className="polaroid-chin-caption">
                    <Camera size={18} color="#8B6F5A" />
                    <span className="polaroid-chin-text">📸 Kartu QR Menghadap Kamera Depan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clothesline of Hanging Recent Presensi Polaroids with Real Paperclips */}
            <div className="clothesline-wrapper">
              <div className="clothesline-header">
                <img
                  src="/assets/scrapbook/icon_sparkle.png"
                  alt="*"
                  style={{ width: 14, height: 14 }}
                />
                <span>Presensi Terkini Hari Ini (Live Stream)</span>
                <img
                  src="/assets/scrapbook/icon_sparkle.png"
                  alt="*"
                  style={{ width: 14, height: 14 }}
                />
              </div>
              <div className="clothesline-string" />
              <div className="clothesline-photos-row">
                {todayRecords.length > 0 ? (
                  todayRecords.slice(-5).map((rec, index) => {
                    const member = getMemberById(rec.member_id);
                    const rotations = ['-2deg', '3deg', '-1deg', '2deg', '-3deg'];
                    const rot = rotations[index % rotations.length];
                    const time = rec.check_in_at
                      ? new Date(rec.check_in_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '--:--';

                    return (
                      <div
                        key={rec.id}
                        className="hanging-polaroid-item"
                        style={{ transform: `rotate(${rot})` }}
                      >
                        <img
                          src="/assets/scrapbook/clip_paperclip_bronze.png"
                          alt="Clip"
                          className="wooden-clothespin-img"
                        />
                        <div className="mini-polaroid-img-box">
                          {member?.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{member?.full_name.charAt(0) || '👤'}</span>
                          )}
                        </div>
                        <span className="mini-polaroid-name">{member?.full_name || 'Karyawan'}</span>
                        <span className="mini-polaroid-time">⏱️ {time} WIB</span>
                      </div>
                    );
                  })
                ) : (
                  demoMembers.slice(0, 4).map((member, index) => {
                    const rotations = ['-2deg', '2deg', '-1deg', '3deg'];
                    const rot = rotations[index % rotations.length];
                    return (
                      <div
                        key={member.id}
                        className="hanging-polaroid-item"
                        style={{ transform: `rotate(${rot})` }}
                      >
                        <img
                          src="/assets/scrapbook/clip_paperclip_bronze.png"
                          alt="Clip"
                          className="wooden-clothespin-img"
                        />
                        <div className="mini-polaroid-img-box">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{member.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="mini-polaroid-name">{member.full_name}</span>
                        <span className="mini-polaroid-time">Kartu ID Siap</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
