'use client';

import { useState, useEffect } from 'react';

interface InlineCountdownProps {
  targetDate: Date;
}

export function InlineCountdown({ targetDate }: InlineCountdownProps) {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setText('ENDED');
        setEnded(true);
        setUrgent(false);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${d > 0 ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      setUrgent(diff < 24 * 60 * 60 * 1000);
      setEnded(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <span style={{ color: ended ? 'var(--hot)' : urgent ? 'var(--hot)' : undefined, fontWeight: ended || urgent ? 700 : undefined }}>
      {text}
    </span>
  );
}
