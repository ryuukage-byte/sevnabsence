import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { Badge } from '../common/Badge';
import type { Schedule, Shift } from '../../types/attendance';

interface MemberScheduleProps {
  memberId: string;
  memberName: string;
}

export const MemberSchedule: React.FC<MemberScheduleProps> = ({ memberId, memberName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  const schedules = attendanceService.getSchedules(year, month).filter((s) => s.member_id === memberId);
  const shifts = attendanceService.getShifts();

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Generate calendar cells
  const calendarCells = [];
  // Empty lead cells
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-cell cell-empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const schedule = schedules.find((s) => s.schedule_date === dateStr);
    const assignedShift = shifts.find((sh) => sh.id === schedule?.shift_id);
    const isToday =
      new Date().toDateString() === new Date(year, month - 1, day).toDateString();

    calendarCells.push(
      <div key={`day-${day}`} className={`calendar-cell ${isToday ? 'cell-today' : ''}`}>
        <div className="calendar-cell-header">
          <span className="day-number">{day}</span>
          {isToday && <span className="today-indicator">Hari Ini</span>}
        </div>
        <div className="calendar-cell-body">
          {schedule?.schedule_type === 'SHIFT' && assignedShift && (
            <div
              className="shift-tag"
              style={{
                backgroundColor: `${assignedShift.color_code}1A`,
                color: assignedShift.color_code,
                borderColor: assignedShift.color_code
              }}
            >
              <span className="shift-code">{assignedShift.code}</span>
              <span className="shift-name">{assignedShift.name.split(' ')[0]}</span>
            </div>
          )}
          {schedule?.schedule_type !== 'SHIFT' && schedule && (
            <Badge status={schedule.schedule_type} size="sm" />
          )}
          {!schedule && <span className="no-schedule">-</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="member-schedule-container">
      <div className="schedule-header">
        <div className="schedule-title-area">
          <h2>Jadwal Kerja: {memberName}</h2>
          <span className="schedule-month-label">{monthName}</span>
        </div>

        <div className="calendar-nav-buttons">
          <button className="btn-cal-nav" onClick={prevMonth}>
            <ChevronLeft size={18} /> Bulan Lalu
          </button>
          <button className="btn-cal-nav" onClick={nextMonth}>
            Bulan Depan <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="calendar-grid-header">
        <div className="weekday-col weekend-col">Minggu</div>
        <div className="weekday-col">Senin</div>
        <div className="weekday-col">Selasa</div>
        <div className="weekday-col">Rabu</div>
        <div className="weekday-col">Kamis</div>
        <div className="weekday-col">Jumat</div>
        <div className="weekday-col weekend-col">Sabtu</div>
      </div>

      {/* Days Grid */}
      <div className="calendar-days-grid">{calendarCells}</div>
    </div>
  );
};
