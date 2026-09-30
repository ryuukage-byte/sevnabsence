import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, Filter } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Schedule, ScheduleType, Shift, Member } from '../../types/attendance';

export const ScheduleMatrix: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<{
    memberId: string;
    dateStr: string;
    day: number;
    currentType: ScheduleType;
    currentShiftId?: string;
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const members = attendanceService.getMembers();
  const shifts = attendanceService.getShifts();
  const [schedules, setSchedules] = useState<Schedule[]>(
    attendanceService.getSchedules(year, month)
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => {
    const newDate = new Date(year, month - 2, 1);
    setCurrentDate(newDate);
    setSchedules(attendanceService.getSchedules(newDate.getFullYear(), newDate.getMonth() + 1));
    setSelectedCell(null);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month, 1);
    setCurrentDate(newDate);
    setSchedules(attendanceService.getSchedules(newDate.getFullYear(), newDate.getMonth() + 1));
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
  };

  const handleApplyShift = (type: ScheduleType, shiftId?: string) => {
    if (!selectedCell) return;

    attendanceService.updateCellSchedule(
      selectedCell.memberId,
      selectedCell.dateStr,
      type,
      shiftId
    );

    setSchedules([...attendanceService.getSchedules(year, month)]);
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
            Atur penugasan shift kerja, cuti, dan hari libur seluruh staf dalam format tabel matriks.
          </p>
        </div>

        <div className="matrix-month-controls">
          <button className="btn-cal-nav" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <span className="current-month-display">{monthLabel}</span>
          <button className="btn-cal-nav" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="matrix-legend">
        <span className="legend-title">Keterangan:</span>
        {shifts.map((s) => (
          <div key={s.id} className="legend-item">
            <span
              className="legend-badge"
              style={{ backgroundColor: s.color_code, color: '#FFF' }}
            >
              {s.code}
            </span>
            <span className="legend-text">{s.name}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-badge badge-off">OFF</span>
          <span className="legend-text">Libur Rutin</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge badge-leave">CUTI</span>
          <span className="legend-text">Cuti Tahunan</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge badge-sick">SAKIT</span>
          <span className="legend-text">Izin Sakit</span>
        </div>
      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="sticky-col header-member-col">Nama Karyawan</th>
              {daysArray.map((day) => {
                const dayOfWeek = new Date(year, month - 1, day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <th
                    key={day}
                    className={`day-col-header ${isWeekend ? 'weekend-header' : ''}`}
                  >
                    <span className="header-day-num">{day}</span>
                    <span className="header-day-name">
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dayOfWeek]}
                    </span>
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
                    <span className="member-dept-text">{member.department}</span>
                  </div>
                </td>
                {daysArray.map((day) => {
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(
                    day
                  ).padStart(2, '0')}`;
                  const sch = schedules.find(
                    (s) => s.member_id === member.id && s.schedule_date === dateStr
                  );
                  const assignedShift = shifts.find((sh) => sh.id === sch?.shift_id);
                  const isSelected =
                    selectedCell?.memberId === member.id && selectedCell?.day === day;

                  return (
                    <td
                      key={day}
                      className={`matrix-data-cell ${isSelected ? 'cell-selected' : ''}`}
                      onClick={() => handleCellClick(member.id, day)}
                      title={`Klik untuk ubah jadwal ${member.full_name} tgl ${day}`}
                    >
                      {sch?.schedule_type === 'SHIFT' && assignedShift && (
                        <div
                          className="matrix-pill shift-pill"
                          style={{
                            backgroundColor: assignedShift.color_code,
                            color: '#FFFFFF'
                          }}
                        >
                          {assignedShift.code}
                        </div>
                      )}
                      {sch?.schedule_type === 'OFF' && (
                        <div className="matrix-pill off-pill">OFF</div>
                      )}
                      {sch?.schedule_type === 'LEAVE' && (
                        <div className="matrix-pill leave-pill">CUTI</div>
                      )}
                      {sch?.schedule_type === 'SICK' && (
                        <div className="matrix-pill sick-pill">SAKIT</div>
                      )}
                      {!sch && <div className="matrix-pill empty-pill">-</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
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
                      style={{ backgroundColor: shift.color_code, color: '#FFF' }}
                    >
                      {shift.code}
                    </span>
                    <span className="opt-label">{shift.name}</span>
                    <span className="opt-time">
                      {shift.start_time} - {shift.end_time}
                    </span>
                  </button>
                ))}

                <button
                  className="popover-option-btn off-opt"
                  onClick={() => handleApplyShift('OFF')}
                >
                  <span className="opt-badge badge-off">OFF</span>
                  <span className="opt-label">Libur Rutin (Day Off)</span>
                </button>

                <button
                  className="popover-option-btn leave-opt"
                  onClick={() => handleApplyShift('LEAVE')}
                >
                  <span className="opt-badge badge-leave">CUTI</span>
                  <span className="opt-label">Cuti Tahunan / Izin</span>
                </button>

                <button
                  className="popover-option-btn sick-opt"
                  onClick={() => handleApplyShift('SICK')}
                >
                  <span className="opt-badge badge-sick">SAKIT</span>
                  <span className="opt-label">Izin Sakit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
