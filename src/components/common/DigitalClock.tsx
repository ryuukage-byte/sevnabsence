import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';

interface DigitalClockProps {
  compact?: boolean;
  timezone?: string;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ compact = false, timezone }) => {
  const [now, setNow] = useState(new Date());
  const org = attendanceService.getOrganization();
  const tz = timezone || org.timezone || 'Asia/Tokyo';
  const tzLabel = tz === 'Asia/Tokyo' ? 'JST' : 'WIB';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format hours, minutes, seconds strictly in target timezone
  const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = timeFormatter.formatToParts(now);
  const hours = parts.find((p) => p.type === 'hour')?.value || '00';
  const minutes = parts.find((p) => p.type === 'minute')?.value || '00';
  const seconds = parts.find((p) => p.type === 'second')?.value || '00';

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const dateStr = dateFormatter.format(now);

  if (compact) {
    return (
      <div className="digital-clock-compact" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <span className="clock-time">{hours}:{minutes}:{seconds} <small style={{ fontSize: '0.75em', opacity: 0.75 }}>{tzLabel}</small></span>
        <span className="clock-date">{dateStr}</span>
      </div>
    );
  }

  return (
    <div className="digital-clock-modern" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <div className="clock-time-display">
        <span className="clock-digit">{hours}</span>
        <span className="clock-separator">:</span>
        <span className="clock-digit">{minutes}</span>
        <span className="clock-separator" style={{ color: 'var(--text-muted)' }}>:</span>
        <span className="clock-digit clock-seconds">{seconds}</span>
        <span className="clock-tz-badge" style={{ marginLeft: '6px', fontSize: '0.55em', fontWeight: 600, color: 'var(--text-muted)' }}>{tzLabel}</span>
      </div>
      <div className="clock-date-display">{dateStr}</div>
    </div>
  );
};

