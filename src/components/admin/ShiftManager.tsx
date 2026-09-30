import React, { useState } from 'react';
import { Clock, Plus, Edit2, ShieldAlert, Check } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Shift } from '../../types/attendance';

export const ShiftManager: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(attendanceService.getShifts());
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [formShift, setFormShift] = useState({
    name: '',
    code: '',
    start_time: '08:00',
    end_time: '17:00',
    early_tolerance_mins: 30,
    late_tolerance_mins: 10,
    is_overtime_allowed: false,
    color_code: '#10B981'
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
      color_code: '#10B981'
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

  return (
    <div className="shift-manager-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Pengaturan Jam Shift & Toleransi</h2>
          <p className="view-subtitle">
            Konfigurasi jam masuk/pulang kerja dan toleransi keterlambatan sesuai kebijakan organisasi.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Tambah Shift</span>
        </button>
      </div>

      {/* Shifts Card Grid */}
      <div className="shifts-cards-grid">
        {shifts.map((shift) => (
          <div key={shift.id} className="shift-card-item">
            <div className="shift-card-top">
              <div
                className="shift-card-badge"
                style={{ backgroundColor: shift.color_code, color: '#FFFFFF' }}
              >
                {shift.code}
              </div>
              <h3 className="shift-card-title">{shift.name}</h3>
              <button
                className="btn-shift-edit"
                onClick={() => handleOpenEdit(shift)}
                title="Edit Shift"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="shift-hours-row font-mono">
              <Clock size={20} className="text-slate-500" />
              <span>
                {shift.start_time} — {shift.end_time} WIB
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
                <span className="rule-label">Boleh Masuk Lebih Awal:</span>
                <span className="rule-val text-emerald-600 font-semibold">
                  -{shift.early_tolerance_mins} Menit
                </span>
              </div>
            </div>

            <div className="shift-sample-scenario">
              <span className="scenario-title">Simulasi Waktu:</span>
              <p className="scenario-text">
                Jika mulai pukul {shift.start_time}, karyawan yang scan sampai{' '}
                <strong>
                  {(() => {
                    const [h, m] = shift.start_time.split(':').map(Number);
                    const totalM = h * 60 + m + shift.late_tolerance_mins;
                    const resH = String(Math.floor(totalM / 60)).padStart(2, '0');
                    const resM = String(totalM % 60).padStart(2, '0');
                    return `${resH}:${resM}`;
                  })()}{' '}
                  WIB
                </strong>{' '}
                tetap dihitung <em>Tepat Waktu</em>.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Shift Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingShift ? 'Edit Shift Kerja' : 'Tambah Shift Baru'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="modal-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
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
                <div className="form-group" style={{ flex: 1 }}>
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
                <div className="form-group">
                  <label>Jam Masuk (Start Time)</label>
                  <input
                    type="time"
                    required
                    value={formShift.start_time}
                    onChange={(e) =>
                      setFormShift({ ...formShift, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Jam Pulang (End Time)</label>
                  <input
                    type="time"
                    required
                    value={formShift.end_time}
                    onChange={(e) =>
                      setFormShift({ ...formShift, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Toleransi Terlambat (Menit)</label>
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
                <div className="form-group">
                  <label>Toleransi Datang Lebih Awal (Menit)</label>
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
                  {['#10B981', '#0284C7', '#8B5CF6', '#F59E0B', '#EC4899', '#64748B'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-dot ${
                          formShift.color_code === color ? 'selected' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormShift({ ...formShift, color_code: color })}
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
