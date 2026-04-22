'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface LiveCountdownProps {
  targetDate: Date;
  categoryColor?: string;
}

export function LiveCountdown({ targetDate, categoryColor = 'var(--accent)' }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [secsPulse, setSecsPulse] = useState(false);
  const prevSecs = useRef(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, mins: 0, secs: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      // Check urgency thresholds
      setIsUrgent(diff < 24 * 60 * 60 * 1000); // < 24h
      setIsCritical(diff < 3 * 60 * 60 * 1000); // < 3h

      return { days, hours, mins, secs };
    };

    const update = () => {
      const newTime = calculateTimeLeft();

      // Trigger pulse animation when seconds change
      if (newTime.secs !== prevSecs.current) {
        setSecsPulse(true);
        setTimeout(() => setSecsPulse(false), 150);
        prevSecs.current = newTime.secs;
      }

      setTimeLeft(newTime);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const blocks = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.mins, label: 'MINS' },
    { value: timeLeft.secs, label: 'SECS', isPulsing: secsPulse },
  ];

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.mins === 0 && timeLeft.secs === 0) {
    return null;
  }

  return (
    <div>
      {/* CSS for animations */}
      <style>{`
        @keyframes countdownPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .countdown-critical {
          animation: countdownPulse 1s ease-in-out infinite;
        }
      `}</style>

      {/* Label with clock icon */}
      <p
        className="flex items-center gap-1.5"
        style={{
          fontSize: '12px',
          fontWeight: isCritical ? 700 : 600,
          color: isCritical ? '#EF4444' : isUrgent ? '#F59E0B' : categoryColor,
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <Clock style={{ width: '14px', height: '14px' }} />
        {isCritical ? 'Ending soon!' : isUrgent ? 'Ending soon' : 'Competition ends in'}
      </p>

      {/* Countdown blocks - Premium style */}
      <div className={`flex gap-2 ${isCritical ? 'countdown-critical' : ''}`}>
        {blocks.map((block) => (
          <div key={block.label} className="text-center">
            <div
              style={{
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #ffffff, #FAFAFA)',
                borderRadius: '14px',
                border: isCritical
                  ? '1.5px solid rgba(239, 68, 68, 0.2)'
                  : isUrgent
                  ? '1.5px solid rgba(245, 158, 11, 0.2)'
                  : '1.5px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                fontSize: '24px',
                fontWeight: 800,
                color: isCritical ? 'var(--hot)' : isUrgent ? 'var(--warn)' : 'var(--ink)',
                transform: block.isPulsing ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {block.value.toString().padStart(2, '0')}
            </div>
            <p
              style={{
                fontSize: '10px',
                color: isCritical ? 'var(--hot)' : isUrgent ? 'var(--warn)' : 'var(--ink-faint)',
                marginTop: '6px',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              {block.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
