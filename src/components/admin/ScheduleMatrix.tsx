import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { facilityService } from '../../services/facilityService';
import { useFacility } from '../../hooks/useFacility';
import { NON_SHIFT_TYPES, SchedulePill } from '../common/SchedulePill';
import type { ScheduleType } from '../../types/attendance';

export const ScheduleMatrix: React.FC = () => {
  useFacility(); // re-render when approvals / generator / publish change schedules
  const [currentDate, setCurrentDate] = useState(new Date());
  const [floorChoice, setFloorChoice] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<{
    memberId: string;
    dateStr: string;
    day: number;
    currentType: ScheduleType;
    currentShiftId?: string;
  } | null>(null);

  const org = attendanceService.getOrganization();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const members = attendanceService.getMembers();
  const shifts = attendanceService.getShifts();
  // re-read on every render so approvals / generator writes show up immediately
  const schedules = attendanceService.getSchedules(year, month);
  const floors = facilityService.getFloors();
  const published = facilityService.isPublished(year, month);
  const floorShort = (id?: string) => {
    const f = floors.find((x) => x.id === id);
    return f ? `${f.level}F` : '';
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Compute today's date string in branch timezone
  const todayDateObj = new Date();
  const todayYear = todayDateObj.getFullYear();
  const todayMonth = todayDateObj.getMonth() + 1;
  const todayDay = todayDateObj.getDate();
  const isCurrentMonthView = todayYear === year && todayMonth === month;

  const prevMonth = () => {
    const newDate = new Date(year, month - 2, 1);
    setCurrentDate(newDate);
    setSelectedCell(null);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month, 1);
    setCurrentDate(newDate);
    setSelectedCell(null);
  };

  const handleCellClick = (memberId: string, day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sch = schedules.find((s) => s.member_id === memberId && s.schedule_date === dateStr);

    setSelectedCell({
      memberId,
      dateStr,
      day,
      currentType: sch?.schedule_type || 'SHIFT',
      currentShiftId: sch?.shift_id || shifts[0]?.id
    });
    setFloorChoice(sch?.floor_id || facilityService.getStaffProfile(memberId).home_floor_id || floors[0]?.id || '');
  };

  const handleApplyShift = (type: ScheduleType, shiftId?: string) => {
    if (!selectedCell) return;

    attendanceService.updateCellSchedule(
      selectedCell.memberId,
      selectedCell.dateStr,
      type,
      shiftId,
      floorChoice || undefined
    );
    facilityService.touch();
    setSelectedCell(null);
  };

  const monthLabel = currentDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="schedule-matrix-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Matriks Jadwal Bulanan</h2>
          <p className="view-subtitle">
            Penugasan shift kerja seluruh staf cabang {org.display_name}. Kolom nama disematkan untuk kemudahan navigasi tanggal 1–31.
          </p>
        </div>

        <div className="kg-actions">
          <span className={`status-pill status-pill--${published ? 'present' : 'off'}`}>
            {published ? 'Terbit ke staf' : 'Draft'}
          </span>
          {published ? (
            <button type="button" className="btn-secondary kg-btn-sm" onClick={() => facilityService.unpublishMonth(year, month)}>
              Tarik publikasi
            </button>
          ) : (
            <button type="button" className="btn-primary kg-btn-sm" onClick={() => facilityService.publishMonth(year, month)} disabled={!schedules.length}>
              <Send size={14} /> Publikasikan
            </button>
          )}
        <div className="matrix-month-controls">
          <button className="btn-cal-nav" onClick={prevMonth} title="Bulan Sebelumnya" aria-label="Bulan sebelumnya">
            <ChevronLeft size={18} />
          </button>
          <div className="current-month-banner">
            <span className="current-month-display">{monthLabel}</span>
          </div>
          <button className="btn-cal-nav" onClick={nextMonth} title="Bulan Berikutnya" aria-label="Bulan berikutnya">
            <ChevronRight size={18} />
          </button>
        </div>
        </div>
      </div>

      {/* Harmonized Shift Legend */}
      <div className="matrix-legend">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={16} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
          <span className="legend-title">Keterangan:</span>
        </div>
        {shifts.map((s) => (
          <div key={s.id} className="legend-item">
            <span
              className="legend-badge"
              style={{ backgroundColor: s.color_code, color: 'var(--text-on-brand)' }}
            >
              {s.code}
            </span>
            <span className="legend-text">{s.name}</span>
          </div>
        ))}
        {NON_SHIFT_TYPES.filter((t) => t.type !== 'HOLIDAY').map((t) => (
          <div key={t.type} className="legend-item">
            <span className={`legend-badge matrix-pill ${t.className}`}>{t.code}</span>
            <span className="legend-text">{t.label}</span>
          </div>
        ))}
        <div className="legend-item" style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span className="today-legend-indicator" /> Hari Ini
          <span className="sunday-legend-indicator" style={{ marginLeft: 10 }} /> Minggu
        </div>
      </div>

      {/* Spreadsheet Matrix Table with Sticky Pinned Employee Column */}
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="sticky-col header-member-col">
                <span className="header-member-title">Nama Staf & Departemen</span>
              </th>
              {daysArray.map((day) => {
                const dayOfWeek = new Date(year, month - 1, day).getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const isToday = isCurrentMonthView && todayDay === day;

                return (
                  <th
                    key={day}
                    className={`day-col-header ${isSunday ? 'sunday-col' : ''} ${
                      isSaturday ? 'saturday-col' : ''
                    } ${isToday ? 'today-col' : ''}`}
                    title={isToday ? 'Hari Ini' : undefined}
                  >
                    <div className="header-day-stack">
                      <span className="header-day-num">{day}</span>
                      <span className="header-day-name">
                        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dayOfWeek]}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="sticky-col member-row-header">
                  <div className="member-matrix-cell">
                    <span className="member-name-text">{member.full_name}</span>
                    <span className="member-dept-text">
                      {floorShort(facilityService.getStaffProfile(member.id).home_floor_id) || member.department || 'Staff'}
                    </span>
                  </div>
                </td>
                {daysArray.map((day) => {
                  const dayOfWeek = new Date(year, month - 1, day).getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  const isToday = isCurrentMonthView && todayDay === day;

                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(
                    day
                  ).padStart(2, '0')}`;
                  const sch = schedules.find(
                    (s) => s.member_id === member.id && s.schedule_date === dateStr
                  );
                  const isSelected =
                    selectedCell?.memberId === member.id && selectedCell?.day === day;

                  return (
                    <td
                      key={day}
                      className={`matrix-data-cell ${isSunday ? 'sunday-cell' : ''} ${
                        isSaturday ? 'saturday-cell' : ''
                      } ${isToday ? 'today-cell' : ''} ${isSelected ? 'cell-selected' : ''}`}
                      onClick={() => handleCellClick(member.id, day)}
                      title={`Klik untuk ubah jadwal ${member.full_name} (Tgl ${day})`}
                    >
                      <SchedulePill
                        sch={sch}
                        shifts={shifts}
                        suffix={
                          sch?.schedule_type === 'SHIFT' &&
                          sch.floor_id &&
                          sch.floor_id !== facilityService.getStaffProfile(member.id).home_floor_id
                            ? floorShort(sch.floor_id)
                            : undefined
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {shifts.map((shift) => (
              <tr key={shift.id} className="kg-cov-row">
                <td className="sticky-col member-row-header">
                  <span className="kg-cov-label">
                    <span className="kg-shift-chip" style={{ backgroundColor: shift.color_code }}>{shift.code}</span> Jumlah
                  </span>
                </td>
                {daysArray.map((day) => {
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const n = schedules.filter((x) => x.schedule_date === dateStr && x.schedule_type === 'SHIFT' && x.shift_id === shift.id).length;
                  return (
                    <td key={day} className="kg-cov-count">
                      {n || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/* Popover / Quick Edit Dialog for Selected Cell */}
      {selectedCell && (
        <div className="modal-backdrop" onClick={() => setSelectedCell(null)}>
          <div className="modal-card matrix-popover" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Ubah Jadwal: Tgl {selectedCell.day} {monthLabel}
              </h3>
              <button className="btn-close" onClick={() => setSelectedCell(null)}>
                &times;
              </button>
            </div>
            <div className="matrix-popover-content">
              <p className="popover-instruction">Pilih penugasan shift atau status izin:</p>
              {floors.length > 0 && (
                <div className="form-group">
                  <label>Lantai penempatan (untuk shift)</label>
                  <select value={floorChoice} onChange={(e) => setFloorChoice(e.target.value)}>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="popover-options-grid">
                {shifts.map((shift) => (
                  <button
                    key={shift.id}
                    className="popover-option-btn shift-opt"
                    style={{ borderColor: shift.color_code }}
                    onClick={() => handleApplyShift('SHIFT', shift.id)}
                  >
                    <span
                      className="opt-badge"
                      style={{ backgroundColor: shift.color_code, color: 'var(--text-on-brand)' }}
                    >
                      {shift.code}
                    </span>
                    <span className="opt-label">{shift.name}</span>
                    <span className="opt-time">
                      {shift.start_time} - {shift.end_time}
                    </span>
                  </button>
                ))}

                {NON_SHIFT_TYPES.map((t) => (
                  <button key={t.type} className="popover-option-btn off-opt" onClick={() => handleApplyShift(t.type)}>
                    <span className={`opt-badge matrix-pill ${t.className}`}>{t.code}</span>
                    <span className="opt-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
