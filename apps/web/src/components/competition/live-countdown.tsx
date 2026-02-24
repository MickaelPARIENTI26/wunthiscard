'use client';

import { useState, useEffect, useRef } from 'react';

interface LiveCountdownProps {
  targetDate: Date;
}

export function LiveCountdown({ targetDate }: LiveCountdownProps) {
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

      // Check urgency (< 24h)
      setIsUrgent(diff < 24 * 60 * 60 * 1000);
      // Check critical (< 1h)
      setIsCritical(diff < 60 * 60 * 1000);

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

      {/* Label */}
      <p
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: isUrgent ? '#EF4444' : '#6b7088',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {isUrgent ? 'Ending soon!' : 'Competition ends in'}
      </p>

      {/* Countdown blocks */}
      <div className={`flex gap-2 ${isCritical ? 'countdown-critical' : ''}`}>
        {blocks.map((block) => (
          <div key={block.label} className="text-center">
            <div
              style={{
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                fontSize: '22px',
                fontWeight: 700,
                color: isUrgent ? '#EF4444' : '#1a1a2e',
                transform: block.isPulsing ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease-out',
              }}
            >
              {block.value.toString().padStart(2, '0')}
            </div>
            <p
              style={{
                fontSize: '10px',
                color: isUrgent ? '#EF4444' : '#9a9eb0',
                marginTop: '6px',
                fontWeight: 500,
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
