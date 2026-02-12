'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  size?: 'sm' | 'md' | 'lg';
  onComplete?: () => void;
  className?: string;
  showLabels?: boolean;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

const sizeClasses = {
  sm: {
    container: 'gap-1',
    box: 'w-10 h-10 text-sm',
    label: 'text-[10px]',
    separator: 'text-base',
  },
  md: {
    container: 'gap-1 sm:gap-2',
    box: 'w-12 h-12 text-base sm:w-14 sm:h-14 sm:text-lg',
    label: 'text-xs',
    separator: 'text-lg',
  },
  lg: {
    container: 'gap-1 sm:gap-2 md:gap-3',
    box: 'w-14 h-14 text-xl sm:w-18 sm:h-18 sm:text-2xl md:w-20 md:h-20 md:text-3xl',
    label: 'text-xs sm:text-sm',
    separator: 'text-xl md:text-2xl',
  },
};

function TimeUnit({
  value,
  label,
  size,
  showLabel,
}: {
  value: number;
  label: string;
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
}) {
  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          'bg-card/80 border border-primary/20',
          'font-bold overflow-hidden',
          'shadow-lg shadow-black/20',
          classes.box
        )}
        style={{
          background: 'linear-gradient(135deg, oklch(0.14 0.02 270) 0%, oklch(0.10 0.02 270) 100%)',
        }}
      >
        {/* Top shine effect */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
            className="tabular-nums font-[family-name:var(--font-display)]"
            style={{ color: '#FFD700' }}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      {showLabel && (
        <span className={cn('mt-1.5 uppercase tracking-widest font-medium', classes.label)} style={{ color: '#a0a0a0' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  size = 'md',
  onComplete,
  className,
  showLabels = true,
}: CountdownTimerProps) {
  // Initialize with zeros to avoid hydration mismatch
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted and initial time on client only
  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(targetDate));
  }, [targetDate]);

  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0 &&
        !isComplete
      ) {
        setIsComplete(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete, isComplete, mounted]);

  const classes = sizeClasses[size];

  return (
    <div className={cn('flex items-center justify-center lg:justify-start', classes.container, className)}>
      <TimeUnit value={timeLeft.days} label="Days" size={size} showLabel={showLabels} />
      <span className={cn('font-bold self-start mt-2 sm:mt-3', classes.separator)} style={{ color: 'rgba(255, 215, 0, 0.5)' }}>
        :
      </span>
      <TimeUnit value={timeLeft.hours} label="Hours" size={size} showLabel={showLabels} />
      <span className={cn('font-bold self-start mt-2 sm:mt-3', classes.separator)} style={{ color: 'rgba(255, 215, 0, 0.5)' }}>
        :
      </span>
      <TimeUnit value={timeLeft.minutes} label="Mins" size={size} showLabel={showLabels} />
      <span className={cn('font-bold self-start mt-2 sm:mt-3', classes.separator)} style={{ color: 'rgba(255, 215, 0, 0.5)' }}>
        :
      </span>
      <TimeUnit value={timeLeft.seconds} label="Secs" size={size} showLabel={showLabels} />
    </div>
  );
}
