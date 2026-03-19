'use client';

import { useState, useEffect } from 'react';

interface UrgencyBannerProps {
  drawDate: Date;
  status: string;
}

export function UrgencyBanner({ drawDate, status }: UrgencyBannerProps) {
  const [timeLabel, setTimeLabel] = useState('');
  const [level, setLevel] = useState<'ending-soon' | 'last-hours' | null>(null);

  useEffect(() => {
    if (status !== 'ACTIVE') return;

    const update = () => {
      const diff = new Date(drawDate).getTime() - Date.now();
      if (diff <= 0 || diff >= 24 * 60 * 60 * 1000) {
        setLevel(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (diff < 3 * 60 * 60 * 1000) {
        setLevel('last-hours');
        setTimeLabel(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
      } else {
        setLevel('ending-soon');
        setTimeLabel(`${hours}h ${mins}m`);
      }
    };

    update();
    // Recalculate every minute if >1h, every second if <1h
    const diff = new Date(drawDate).getTime() - Date.now();
    const intervalMs = diff < 60 * 60 * 1000 ? 1000 : 60000;
    const interval = setInterval(update, intervalMs);
    return () => clearInterval(interval);
  }, [drawDate, status]);

  if (!level) return null;

  const isLastHours = level === 'last-hours';

  return (
    <div
      style={{
        background: isLastHours ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
        border: `1px solid ${isLastHours ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
        borderRadius: '10px',
        padding: '8px 14px',
      }}
    >
      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isLastHours ? '#EF4444' : '#F59E0B',
          margin: 0,
        }}
      >
        {isLastHours
          ? `Last hours! Draw in ${timeLabel}`
          : `This competition ends in ${timeLabel}`}
      </p>
    </div>
  );
}
