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
  sm: 'h-2',
  md: 'h-3',
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
  const remaining = total - sold;

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

  // Determine urgency level
  const isUrgent = percentage >= 80;
  const isCritical = percentage >= 90;

  // Get label color based on urgency
  const getLabelColor = () => {
    if (isCritical) return 'text-red-400';
    if (isUrgent) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={cn('text-xs font-medium', getLabelColor())}>
            {remaining > 0 ? (
              <>
                <span className="tabular-nums">{remaining.toLocaleString('en-GB')}</span>
                {' tickets remaining'}
              </>
            ) : (
              'Sold out!'
            )}
          </span>
          {showPercentage && (
            <span className={cn('text-xs font-bold tabular-nums', getLabelColor())}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-secondary/50 border border-border/50',
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full progress-gradient',
            isCritical && 'bg-gradient-to-r from-red-600 via-red-500 to-red-600',
            isUrgent && !isCritical && 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600'
          )}
          style={
            !isUrgent
              ? {
                  background:
                    'linear-gradient(90deg, oklch(0.65 0.18 85) 0%, oklch(0.82 0.165 85) 50%, oklch(0.65 0.18 85) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'progressShimmer 2s ease-in-out infinite',
                }
              : undefined
          }
          initial={{ width: 0 }}
          animate={{ width: `${animatedPercentage}%` }}
          transition={{ duration: animate ? 0.8 : 0, ease: 'easeOut' }}
        />
      </div>
      {!showLabel && showPercentage && (
        <div className="flex justify-end mt-1">
          <span className={cn('text-xs font-bold tabular-nums', getLabelColor())}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
