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
  },
  md: {
    container: 'gap-1 sm:gap-2',
    box: 'w-12 h-12 text-base sm:w-14 sm:h-14 sm:text-lg',
    label: 'text-xs',
  },
  lg: {
    container: 'gap-1 sm:gap-2 md:gap-3',
    box: 'w-14 h-14 text-lg sm:w-16 sm:h-16 sm:text-xl md:w-20 md:h-20 md:text-2xl',
    label: 'text-xs sm:text-sm',
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
          'relative flex items-center justify-center rounded-lg bg-card border border-border font-bold overflow-hidden',
          classes.box
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="tabular-nums"
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      {showLabel && (
        <span className={cn('mt-1 text-muted-foreground uppercase tracking-wider', classes.label)}>
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
  // Initialize with zeros to avoid hydration mismatch - Date.now() differs between server and client
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
    <div className={cn('flex items-center', classes.container, className)}>
      <TimeUnit value={timeLeft.days} label="Days" size={size} showLabel={showLabels} />
      <span className={cn('font-bold text-muted-foreground', size === 'lg' ? 'text-2xl' : 'text-lg')}>
        :
      </span>
      <TimeUnit value={timeLeft.hours} label="Hours" size={size} showLabel={showLabels} />
      <span className={cn('font-bold text-muted-foreground', size === 'lg' ? 'text-2xl' : 'text-lg')}>
        :
      </span>
      <TimeUnit value={timeLeft.minutes} label="Mins" size={size} showLabel={showLabels} />
      <span className={cn('font-bold text-muted-foreground', size === 'lg' ? 'text-2xl' : 'text-lg')}>
        :
      </span>
      <TimeUnit value={timeLeft.seconds} label="Secs" size={size} showLabel={showLabels} />
    </div>
  );
}
