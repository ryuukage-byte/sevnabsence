import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  compact?: boolean;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ compact = false }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (compact) {
    return (
      <div className="digital-clock-compact">
        <span className="clock-time">{hours}:{minutes}:{seconds}</span>
        <span className="clock-date">{dateStr}</span>
      </div>
    );
  }

  return (
    <div className="digital-clock-modern">
      <div className="clock-time-display">
        <span className="clock-digit">{hours}</span>
        <span className="clock-separator">:</span>
        <span className="clock-digit">{minutes}</span>
        <span className="clock-separator" style={{ color: 'var(--text-muted)' }}>:</span>
        <span className="clock-digit clock-seconds">{seconds}</span>
      </div>
      <div className="clock-date-display">{dateStr}</div>
    </div>
  );
};
