import React, { useState } from 'react';
import { Clock, Plus, Edit2, ShieldAlert, Check, Moon, Sun, Sunrise, Info } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Shift } from '../../types/attendance';

export const ShiftManager: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(attendanceService.getShifts());
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const org = attendanceService.getOrganization();
  const tzLabel = org.timezone === 'Asia/Tokyo' ? 'JST' : 'WIB';

  const [formShift, setFormShift] = useState({
    name: '',
    code: '',
    start_time: '08:00',
    end_time: '17:00',
    early_tolerance_mins: 30,
    late_tolerance_mins: 10,
    is_overtime_allowed: false,
    color_code: '#3B7A57'
  });

  const handleOpenAdd = () => {
    setEditingShift(null);
    setFormShift({
      name: '',
      code: '',
      start_time: '08:00',
      end_time: '17:00',
      early_tolerance_mins: 30,
      late_tolerance_mins: 10,
      is_overtime_allowed: false,
      color_code: '#3B7A57'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormShift({
      name: shift.name,
      code: shift.code,
      start_time: shift.start_time,
      end_time: shift.end_time,
      early_tolerance_mins: shift.early_tolerance_mins,
      late_tolerance_mins: shift.late_tolerance_mins,
      is_overtime_allowed: shift.is_overtime_allowed,
      color_code: shift.color_code
    });
    setShowModal(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formShift.name || !formShift.code) return;

    if (editingShift) {
      attendanceService.updateShift(editingShift.id, formShift);
    } else {
      attendanceService.addShift(formShift);
    }

    setShifts([...attendanceService.getShifts()]);
    setShowModal(false);
  };

  // Helper to check cross-midnight
  const isCrossMidnight = (start: string, end: string) => {
    return end < start;
  };

  return (
    <div className="shift-manager-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Pengaturan Jam Shift & Toleransi</h2>
          <p className="view-subtitle">
            Konfigurasi jam masuk/pulang kerja cabang {org.display_name} ({tzLabel}). Mendukung shift malam lintas tengah malam (cross-midnight).
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Shift</span>
        </button>
      </div>

      {/* Main Layout: Shift Cards + Operational Guidelines Column */}
      <div className="shifts-two-column-layout">
        {/* Left Column: Shift Cards */}
        <div className="shifts-cards-grid">
          {shifts.map((shift) => {
            const crossMidnight = isCrossMidnight(shift.start_time, shift.end_time);

            return (
              <div key={shift.id} className="shift-card-item">
                <div className="shift-card-top">
                  <div
                    className="shift-card-badge"
                    style={{ backgroundColor: shift.color_code, color: 'var(--text-on-brand)' }}
                  >
                    {shift.code}
                  </div>
                  <div className="shift-title-block">
                    <h3 className="shift-card-title">{shift.name}</h3>
                    {crossMidnight && (
                      <span className="shift-night-badge">
                        <Moon size={11} /> Lintas Hari (+1)
                      </span>
                    )}
                  </div>
                  <button
                    className="btn-shift-edit"
                    onClick={() => handleOpenEdit(shift)}
                    title="Edit Shift"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>

                <div className="shift-hours-row font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                  <span>
                    {shift.start_time} — {shift.end_time} {tzLabel}
                  </span>
                </div>

                <div className="shift-rules-list">
                  <div className="rule-item">
                    <span className="rule-label">Toleransi Terlambat:</span>
                    <span className="rule-val text-amber-600 font-semibold">
                      +{shift.late_tolerance_mins} Menit
                    </span>
                  </div>
                  <div className="rule-item">
                    <span className="rule-label">Boleh Masuk Awal:</span>
                    <span className="rule-val text-emerald-600 font-semibold">
                      -{shift.early_tolerance_mins} Menit
                    </span>
                  </div>
                </div>

                <div className="shift-sample-scenario">
                  <span className="scenario-title">Ketentuan Jam:</span>
                  <p className="scenario-text">
                    Mulai <strong>{shift.start_time}</strong>. Karyawan yang scan sampai{' '}
                    <strong>
                      {(() => {
                        const [h, m] = shift.start_time.split(':').map(Number);
                        const totalM = h * 60 + m + shift.late_tolerance_mins;
                        const resH = String(Math.floor(totalM / 60) % 24).padStart(2, '0');
                        const resM = String(totalM % 60).padStart(2, '0');
                        return `${resH}:${resM}`;
                      })()}{' '}
                      {tzLabel}
                    </strong>{' '}
                    tetap dihitung <em>Tepat Waktu</em>.
                    {crossMidnight && (
                      <span style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)' }}>
                        Selesai pukul {shift.end_time} keesokan paginya (hari kerja tetap sama).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Policy & Cross-Midnight Rules Sidebar */}
        <div className="shifts-policy-sidebar">
          <div className="policy-box">
            <div className="policy-header">
              <Info size={18} strokeWidth={2.2} />
              <h4>Panduan Shift & Cross-Midnight</h4>
            </div>
            <div className="policy-content">
              <p>
                <strong>Zona Waktu Cabang:</strong> Seluruh jadwal dan batas toleransi dievaluasi berdasarkan zona waktu <strong>{tzLabel} ({org.timezone})</strong>.
              </p>
              <div className="policy-separator" />
              <p>
                <strong>Shift Malam (21:00 – 06:00):</strong>
                <br />
                Sistem otomatis menandai waktu keluar 06:00 sebagai hari berikutnya (+1) sehingga perhitungan durasi kerja dan keterlambatan tetap akurat tanpa error nilai negatif.
              </p>
              <div className="policy-separator" />
              <p>
                <strong>Anti-Joki & Shift Mismatch:</strong>
                <br />
                Scan masuk yang terpaut lebih dari 4 jam dari jadwal shift otomatis ditandai <em>Perlu Review Supervisor</em> dan tidak dicatat sebagai hadir normal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Shift Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingShift ? 'Edit Shift Kerja' : 'Tambah Shift Baru'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="modal-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2, minWidth: 0 }}>
                  <label>Nama Shift *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Shift Pagi (A)"
                    value={formShift.name}
                    onChange={(e) =>
                      setFormShift({ ...formShift, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Kode Shift *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="A"
                    value={formShift.code}
                    onChange={(e) =>
                      setFormShift({ ...formShift, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jam Masuk (24 Jam) *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    placeholder="08:00"
                    value={formShift.start_time}
                    onChange={(e) =>
                      setFormShift({ ...formShift, start_time: e.target.value })
                    }
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Format: HH:mm (Contoh 08:00)</small>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jam Pulang (24 Jam) *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    placeholder="17:00"
                    value={formShift.end_time}
                    onChange={(e) =>
                      setFormShift({ ...formShift, end_time: e.target.value })
                    }
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Format: HH:mm (Contoh 17:00 / 06:00)</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Toleransi Terlambat (Mnt)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formShift.late_tolerance_mins}
                    onChange={(e) =>
                      setFormShift({
                        ...formShift,
                        late_tolerance_mins: Number(e.target.value)
                      })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Boleh Masuk Awal (Mnt)</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formShift.early_tolerance_mins}
                    onChange={(e) =>
                      setFormShift({
                        ...formShift,
                        early_tolerance_mins: Number(e.target.value)
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Warna Badge Identitas Shift</label>
                <div className="color-picker-row">
                  {['#3B7A57', '#C87A58', '#C9944A', '#8D7B6D', '#7E528C', '#5C7A82'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-dot ${
                          formShift.color_code === color ? 'selected' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormShift({ ...formShift, color_code: color })}
                        title={`Pilih warna ${color}`}
                      >
                        {formShift.color_code === color && <Check size={14} color="#FFF" />}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
