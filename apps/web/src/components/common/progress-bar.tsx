'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  sold: number;
  total: number;
  className?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  sold,
  total,
  className,
  showLabel = true,
  showPercentage = false,
  animate = true,
  size = 'md',
}: ProgressBarProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = total > 0 ? Math.min((sold / total) * 100, 100) : 0;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animate]);

  // Determine bar color based on fill percentage
  const getBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            {sold.toLocaleString('en-GB')} / {total.toLocaleString('en-GB')} tickets sold
          </span>
          {showPercentage && (
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-secondary',
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', getBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${animatedPercentage}%` }}
          transition={{ duration: animate ? 0.8 : 0, ease: 'easeOut' }}
        />
      </div>
      {!showLabel && showPercentage && (
        <div className="flex justify-end mt-1">
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
